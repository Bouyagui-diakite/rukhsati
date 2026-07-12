<?php

namespace App\Services;

use App\Enums\LicenseStatus;
use App\Models\License;
use ArPHP\I18N\Arabic;
use Barryvdh\DomPDF\Facade\Pdf;
use chillerlan\QRCode\Common\EccLevel;
use chillerlan\QRCode\Output\QRMarkupSVG;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Support\Facades\Storage;

/**
 * Génère le certificat d'agrément bilingue (français / arabe) au format PDF,
 * avec un QR code renvoyant vers la page de vérification publique.
 *
 * dompdf ne sait pas façonner l'arabe (liaison contextuelle des glyphes ni
 * bidi) : on pré-façonne donc chaque chaîne arabe avec ar-php (utf8Glyphs),
 * qui produit les formes de présentation déjà réordonnées visuellement, puis
 * dompdf les rend tel quel avec une police arabe embarquée.
 */
class LicensePdf
{
    private Arabic $arabic;

    public function __construct()
    {
        $this->arabic = new Arabic;
    }

    /**
     * Génère (ou régénère) le PDF, le stocke sur le disque configuré et met à
     * jour license.pdf_path. Retourne le chemin relatif sur le disque.
     */
    public function store(License $license): string
    {
        $path = $this->path($license);

        Storage::disk($this->disk())->put($path, $this->render($license));

        $license->forceFill(['pdf_path' => $path])->save();

        return $path;
    }

    /**
     * Rend le PDF en mémoire (contenu binaire) sans le stocker.
     */
    public function render(License $license): string
    {
        $license->loadMissing(['licenseType', 'user']);

        $status = $license->statusEnum();
        $url = $this->verificationUrl($license);

        return Pdf::loadView('licenses.certificate', [
            'license' => $license,
            'status' => $status,
            'verificationUrl' => $url,
            'qr' => $this->qrCode($url),
            'ar' => $this->arabicStrings($license, $status),
            'seal' => $this->seal(),
        ])->setPaper('a4')->output();
    }

    /**
     * Armoiries officielles en data-URI, embarquées dans le certificat.
     */
    private function seal(): ?string
    {
        $path = resource_path('images/armoiries.png');
        if (! is_file($path)) {
            return null;
        }

        return 'data:image/png;base64,'.base64_encode(file_get_contents($path));
    }

    /**
     * URL absolue encodée dans le QR code.
     */
    public function verificationUrl(License $license): string
    {
        return config('rukhsati.verify_url').'/'.$license->verification_token;
    }

    /**
     * QR code encodant $data, renvoyé en data-URI SVG prêt à mettre dans un
     * <img src="…">. On active svgUseFillAttributes pour que chaque module
     * porte un fill explicite (#000 par défaut) : dompdf ne s'appuie pas de
     * façon fiable sur le noir implicite de la spec SVG.
     */
    public function qrCode(string $data): string
    {
        $options = new QROptions([
            'outputInterface' => QRMarkupSVG::class,
            'outputBase64' => true,
            'eccLevel' => EccLevel::Q,
            'scale' => 5,
            'connectPaths' => true,
            'drawLightModules' => false,
            'svgUseFillAttributes' => true,
            'addQuietzone' => true,
            'quietzoneSize' => 2,
        ]);

        return (new QRCode($options))->render($data);
    }

    public function path(License $license): string
    {
        return 'licenses/'.$license->number.'.pdf';
    }

    /**
     * Chaînes arabes du certificat, pré-façonnées pour dompdf.
     *
     * @return array<string, string>
     */
    private function arabicStrings(License $license, LicenseStatus $status): array
    {
        return [
            'country' => $this->ar('الجمهورية الإسلامية الموريتانية'),
            'ministry' => $this->ar('وزارة التجارة والسياحة'),
            'title' => $this->ar('شهادة اعتماد'),
            'holderLabel' => $this->ar('صاحب الرخصة'),
            'typeLabel' => $this->ar('نوع الرخصة'),
            'issuedLabel' => $this->ar('تاريخ الإصدار'),
            'expiresLabel' => $this->ar('صالحة حتى'),
            'statusLabel' => $this->ar('الحالة'),
            'typeName' => $this->ar($license->licenseType->name_ar),
            'statusValue' => $this->ar($this->statusLabelAr($status)),
            'verifyHint' => $this->ar('امسح هذا الرمز للتحقق من صحة الرخصة'),
        ];
    }

    /**
     * Façonne une chaîne arabe (formes contextuelles + réordonnancement RTL)
     * pour un rendu correct par un moteur sans support de l'arabe.
     */
    private function ar(string $text): string
    {
        return $this->arabic->utf8Glyphs($text, 200, false);
    }

    private function statusLabelAr(LicenseStatus $status): string
    {
        return match ($status) {
            LicenseStatus::Valid => 'سارية',
            LicenseStatus::Suspended => 'موقوفة',
            LicenseStatus::Expired => 'منتهية',
            LicenseStatus::Revoked => 'ملغاة',
        };
    }

    private function disk(): string
    {
        return config('rukhsati.license_disk', 'local');
    }
}
