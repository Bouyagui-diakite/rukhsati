<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <style>
        /* Police arabe embarquée : les glyphes latins restent en DejaVu Sans,
           l'arabe (déjà façonné côté PHP) utilise cette police. */
        @font-face {
            font-family: 'arabic';
            font-style: normal;
            font-weight: normal;
            src: url("{{ str_replace('\\', '/', storage_path('fonts/arabic.ttf')) }}") format('truetype');
        }
        @font-face {
            font-family: 'arabic';
            font-style: normal;
            font-weight: bold;
            src: url("{{ str_replace('\\', '/', storage_path('fonts/arabic-bold.ttf')) }}") format('truetype');
        }

        @page { margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: DejaVu Sans, sans-serif;
            color: #1a1a1a;
            font-size: 12px;
            line-height: 1.5;
        }

        .frame {
            position: fixed;
            top: 16px; left: 16px; right: 16px; bottom: 16px;
            border: 6px double #0b3d2e;
        }
        .sheet { position: relative; padding: 30px 42px 42px 42px; }

        /* Bloc arabe : texte déjà en ordre visuel → pas de direction:rtl. */
        .ar { font-family: 'arabic', sans-serif; text-align: right; }

        .header { width: 100%; border-bottom: 2px solid #0b3d2e; padding-bottom: 10px; }
        .header td { vertical-align: top; width: 50%; }
        .header .country { font-size: 13px; font-weight: bold; color: #0b3d2e; }
        .header .country.ar { font-size: 15px; }
        .header .ministry { font-size: 10.5px; margin-top: 4px; text-transform: uppercase; }
        .header .ministry.ar { font-size: 12px; text-transform: none; }

        .seal-wrap { text-align: center; margin-top: 14px; }
        .seal { width: 62px; height: 62px; }

        .title { text-align: center; margin: 12px 0 4px; }
        .title h1 { font-size: 24px; letter-spacing: 4px; color: #0b3d2e; }
        .title .title-ar { font-family: 'arabic', sans-serif; font-size: 20px; color: #0b3d2e; margin-top: 2px; }
        .title .subtitle { font-size: 10px; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }

        .number-band { text-align: center; margin: 2px auto 18px; font-size: 13px; font-weight: bold; color: #0b3d2e; }

        .body { width: 100%; }
        .body td { vertical-align: top; width: 50%; padding-bottom: 10px; }
        .field .label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
        .field .label.ar { font-size: 11px; text-transform: none; letter-spacing: 0; }
        .field .value { font-size: 13px; font-weight: bold; color: #1a1a1a; }
        .field .value.ar { font-family: 'arabic', sans-serif; font-size: 14px; }

        .status { display: inline-block; margin-top: 2px; padding: 2px 10px; border-radius: 3px; font-size: 12px; font-weight: bold; }
        .status-valid { background: #e6f4ea; color: #1a7f37; border: 1px solid #1a7f37; }
        .status-other { background: #fdecec; color: #b42318; border: 1px solid #b42318; }

        .qr-wrap { text-align: center; margin-top: 14px; }
        .qr-box { display: inline-block; padding: 8px; border: 1px solid #ccc; background: #fff; }
        .qr-box img { width: 132px; height: 132px; }
        .qr-caption { font-size: 8.5px; color: #666; margin-top: 5px; }
        .qr-caption .ar { display: inline-block; font-size: 10px; }

        .footer { position: fixed; bottom: 30px; left: 42px; right: 42px; border-top: 1px solid #ccc; padding-top: 8px; font-size: 8.5px; color: #777; }
        .footer table { width: 100%; }
        .footer .verify-url { font-family: DejaVu Sans Mono, monospace; color: #444; word-break: break-all; }
    </style>
</head>
<body>
<div class="frame"></div>
<div class="sheet">
    <table class="header">
        <tr>
            <td>
                <div class="country">RÉPUBLIQUE ISLAMIQUE DE MAURITANIE</div>
                <div class="ministry">Ministère du Commerce et du Tourisme</div>
            </td>
            <td>
                <div class="country ar">{{ $ar['country'] }}</div>
                <div class="ministry ar">{{ $ar['ministry'] }}</div>
            </td>
        </tr>
    </table>

    @if(!empty($seal))
        <div class="seal-wrap"><img src="{{ $seal }}" class="seal" alt=""></div>
    @endif

    <div class="title">
        <h1>AGRÉMENT</h1>
        <div class="title-ar">{{ $ar['title'] }}</div>
        <div class="subtitle">Certificat officiel d'exercice</div>
    </div>

    <div class="number-band">N° {{ $license->number }}</div>

    <table class="body">
        <tr>
            <td>
                <div class="field">
                    <div class="label">Titulaire</div>
                    <div class="value">{{ $license->user->name }}</div>
                </div>
            </td>
            <td>
                <div class="field">
                    <div class="label ar">{{ $ar['holderLabel'] }}</div>
                    <div class="value ar">{{ $license->user->name }}</div>
                </div>
            </td>
        </tr>
        <tr>
            <td>
                <div class="field">
                    <div class="label">Type d'agrément</div>
                    <div class="value">{{ $license->licenseType->name_fr }}</div>
                </div>
            </td>
            <td>
                <div class="field">
                    <div class="label ar">{{ $ar['typeLabel'] }}</div>
                    <div class="value ar">{{ $ar['typeName'] }}</div>
                </div>
            </td>
        </tr>
        <tr>
            <td>
                <div class="field">
                    <div class="label">Délivré le</div>
                    <div class="value">{{ $license->issued_at->format('d/m/Y') }}</div>
                </div>
            </td>
            <td>
                <div class="field">
                    <div class="label ar">{{ $ar['issuedLabel'] }}</div>
                    <div class="value ar">{{ $ar['issuedDate'] }}</div>
                </div>
            </td>
        </tr>
        <tr>
            <td>
                <div class="field">
                    <div class="label">Valable jusqu'au</div>
                    <div class="value">{{ $license->expires_at->format('d/m/Y') }}</div>
                </div>
            </td>
            <td>
                <div class="field">
                    <div class="label ar">{{ $ar['expiresLabel'] }}</div>
                    <div class="value ar">{{ $ar['expiresDate'] }}</div>
                </div>
            </td>
        </tr>
        <tr>
            <td>
                <div class="field">
                    <div class="label">Statut</div>
                    <div>
                        <span class="status {{ $status->value === 'valid' ? 'status-valid' : 'status-other' }}">
                            {{ $status->labelFr() }}
                        </span>
                    </div>
                </div>
            </td>
            <td>
                <div class="field">
                    <div class="label ar">{{ $ar['statusLabel'] }}</div>
                    <div class="value ar">{{ $ar['statusValue'] }}</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="qr-wrap">
        <div class="qr-box">
            <img src="{{ $qr }}" alt="QR">
        </div>
        <div class="qr-caption">
            Scannez ce code pour vérifier l'authenticité de cet agrément.
            <span class="ar">— {{ $ar['verifyHint'] }}</span>
        </div>
    </div>

    <div class="footer">
        <table>
            <tr>
                <td style="width: 62%;">
                    Vérifiable en ligne&nbsp;: <span class="verify-url">{{ $verificationUrl }}</span>
                </td>
                <td style="width: 38%; text-align: right;">
                    Émis le {{ now()->format('d/m/Y') }}
                </td>
            </tr>
        </table>
    </div>
</div>
</body>
</html>
