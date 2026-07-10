<?php

namespace Database\Seeders;

use App\Models\LicenseType;
use Illuminate\Database\Seeder;

class LicenseTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'code' => 'travel_agency',
                'name_fr' => "Licence d'agence de voyage",
                'name_ar' => 'رخصة وكالة سفر',
                'description_fr' => "Autorisation d'exercer l'activité d'agence de voyage et de tourisme.",
                'fee_mru' => 20000,
                'validity_months' => 36,
                'requires_inspection' => false,
                'review_deadline_days' => 10,
                'documents' => [
                    ['name_fr' => 'Registre de commerce', 'name_ar' => 'السجل التجاري'],
                    ['name_fr' => "Numéro d'identification fiscale (NIF)", 'name_ar' => 'رقم التعريف الجبائي'],
                    ['name_fr' => 'Contrat de bail ou titre de propriété du local', 'name_ar' => 'عقد إيجار أو سند ملكية المحل'],
                    ['name_fr' => "Attestation d'assurance responsabilité civile", 'name_ar' => 'شهادة التأمين على المسؤولية المدنية'],
                    ['name_fr' => 'Références bancaires', 'name_ar' => 'مراجع بنكية', 'mandatory' => false],
                ],
            ],
            [
                'code' => 'hotel',
                'name_fr' => "Autorisation d'exploitation hôtelière",
                'name_ar' => 'رخصة استغلال فندقي',
                'description_fr' => "Autorisation d'ouvrir et d'exploiter un établissement hôtelier, avec inspection de classement.",
                'fee_mru' => 50000,
                'validity_months' => 60,
                'requires_inspection' => true,
                'review_deadline_days' => 20,
                'documents' => [
                    ['name_fr' => 'Registre de commerce', 'name_ar' => 'السجل التجاري'],
                    ['name_fr' => "Numéro d'identification fiscale (NIF)", 'name_ar' => 'رقم التعريف الجبائي'],
                    ['name_fr' => 'Titre de propriété ou bail du bâtiment', 'name_ar' => 'سند ملكية أو عقد إيجار المبنى'],
                    ['name_fr' => "Plans de l'établissement", 'name_ar' => 'مخططات المؤسسة'],
                    ['name_fr' => 'Attestation de conformité sécurité incendie', 'name_ar' => 'شهادة مطابقة السلامة من الحرائق'],
                ],
            ],
            [
                'code' => 'import_distribution',
                'name_fr' => "Agrément d'importation et de distribution",
                'name_ar' => 'اعتماد الاستيراد والتوزيع',
                'description_fr' => "Agrément pour l'importation et la distribution de marchandises réglementées.",
                'fee_mru' => 30000,
                'validity_months' => 24,
                'requires_inspection' => false,
                'review_deadline_days' => 15,
                'documents' => [
                    ['name_fr' => 'Registre de commerce', 'name_ar' => 'السجل التجاري'],
                    ['name_fr' => "Numéro d'identification fiscale (NIF)", 'name_ar' => 'رقم التعريف الجبائي'],
                    ['name_fr' => 'Quitus fiscal', 'name_ar' => 'إبراء ذمة جبائي'],
                    ['name_fr' => "Justificatif d'entrepôt de stockage", 'name_ar' => 'إثبات مستودع التخزين'],
                ],
            ],
        ];

        foreach ($types as $data) {
            $documents = $data['documents'];
            unset($data['documents']);

            $type = LicenseType::updateOrCreate(['code' => $data['code']], $data);

            foreach ($documents as $order => $doc) {
                $type->requiredDocuments()->updateOrCreate(
                    ['name_fr' => $doc['name_fr']],
                    $doc + ['sort_order' => $order, 'mandatory' => $doc['mandatory'] ?? true],
                );
            }
        }
    }
}
