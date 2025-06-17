// ===== INTEGRACIÓN CON GMAIL =====

class GmailAPI {
    constructor() {
        this.fromEmail = 'losmollestunquen@gmail.com';
        this.templates = {
            recordatorioPago: {
                subject: 'Recordatorio de Pago - Gasto Común {mes} {año}',
                body: `
                    <h2>Condominio Los Molles</h2>
                    <p>Estimado/a {nombreResidente},</p>
                    
                    <p>Le recordamos que el pago del gasto común correspondiente al mes de <strong>{mes} {año}</strong> vence el día <strong>10 de {mesVencimiento}</strong>.</p>
                    
                    <h3>Detalle del Pago:</h3>
                    <ul>
                        <li><strong>Parcela:</strong> {nParcela}</li>
                        <li><strong>Monto:</strong> {montoGastoComun}</li>
                        <li><strong>Período:</strong> {periodo}</li>
                        <li><strong>Fecha de Vencimiento:</strong> {fechaVencimiento}</li>
                    </ul>
                    
                    <p>Para realizar el pago, puede hacerlo mediante:</p>
                    <ul>
                        <li>Transferencia bancaria</li>
                        <li>Depósito bancario</li>
                        <li>Efectivo en administración</li>
                    </ul>
                    
                    <p>Si ya realizó el pago, por favor ignore este mensaje.</p>
                    
                    <p>Saludos cordiales,<br>
                    Administración Condominio Los Molles</p>
                `
            },
            comprobantePago: {
                subject: 'Comprobante de Pago - Gasto Común {periodo}',
                body: `
                    <h2>Condominio Los Molles</h2>
                    <h3>Comprobante de Pago</h3>
                    
                    <p>Estimado/a {nombreResidente},</p>
                    
                    <p>Confirmamos la recepción de su pago correspondiente al gasto común del período <strong>{periodo}</strong>.</p>
                    
                    <h3>Detalle del Pago:</h3>
                    <table border="1" style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                        <tr>
                            <td><strong>Parcela:</strong></td>
                            <td>{nParcela}</td>
                        </tr>
                        <tr>
                            <td><strong>Período:</strong></td>
                            <td>{periodo}</td>
                        </tr>
                        <tr>
                            <td><strong>Monto Pagado:</strong></td>
                            <td>{montoPagado}</td>
                        </tr>
                        <tr>
                            <td><strong>Fecha de Pago:</strong></td>
                            <td>{fechaPago}</td>
                        </tr>
                        <tr>
                            <td><strong>Método de Pago:</strong></td>
                            <td>{metodoPago}</td>
                        </tr>
                        <tr>
                            <td><strong>Estado:</strong></td>
                            <td>{estado}</td>
                        </tr>
                    </table>
                    
                    <p>Gracias por mantener sus pagos al día.</p>
                    
                    <p>Saludos cordiales,<br>
                    Administración Condominio Los Molles</p>
                `
            },
            estadoCuenta: {
                subject: 'Estado de Cuenta - Parcela {nParcela}',
                body: `
                    <h2>Condominio Los Molles</h2>
                    <h3>Estado de Cuenta - Parcela {nParcela}</h3>
                    
                    <p>Estimado/a {nombreResidente},</p>
                    
                    <p>A continuación se detalla el estado de cuenta de su parcela:</p>
                    
                    <h3>Información General:</h3>
                    <ul>
                        <li><strong>Propietario:</strong> {nombreResidente}</li>
                        <li><strong>Parcela:</strong> {nParcela}</li>
                        <li><strong>Email:</strong> {email}</li>
                        <li><strong>Valor Gasto Común:</strong> {valorGastoComun}</li>
                    </ul>
                    
                    <h3>Resumen Financiero:</h3>
                    {resumenFinanciero}
                    
                    <p>Si tiene consultas sobre su estado de cuenta, no dude en contactarnos.</p>
                    
                    <p>Saludos cordiales,<br>
                    Administración Condominio Los Molles</p>
                `
            },
            notificacionMulta: {
                subject: 'Notificación de Multa - Parcela {nParcela}',
                body: `
                    <h2>Condominio Los Molles</h2>
                    <h3>Notificación de Multa</h3>
                    
                    <p>Estimado/a {nombreResidente},</p>
                    
                    <p>Por medio de la presente, le informamos que se ha cursado una multa a su parcela por la siguiente infracción:</p>
                    
                    <h3>Detalle de la Multa:</h3>
                    <table border="1" style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                        <tr>
                            <td><strong>Parcela:</strong></td>
                            <td>{nParcela}</td>
                        </tr>
                        <tr>
                            <td><strong>Fecha de Infracción:</strong></td>
                            <td>{fechaInfraccion}</td>
                        </tr>
                        <tr>
                            <td><strong>Descripción:</strong></td>
                            <td>{descripcion}</td>
                        </tr>
                        <tr>
                            <td><strong>Monto de la Multa:</strong></td>
                            <td>{monto}</td>
                        </tr>
                    </table>
                    
                    <p>Esta multa se agregará automáticamente a su estado de cuenta y deberá ser cancelada junto con el próximo gasto común.</p>
                    
                    <p>Si desea presentar un descargo o tiene consultas sobre esta multa, puede contactarnos dentro de los próximos 15 días hábiles.</p>
                    
                    <p>Saludos cordiales,<br>
                    Administración Condominio Los Molles</p>
                `
            },
            citacionAsamblea: {
                subject: 'Citación a Asamblea {tipoAsamblea} - {fecha}',
                body: `
                    <h2>Condominio Los Molles</h2>
                    <h3>Citación a Asamblea {tipoAsamblea}</h3>
                    
                    <p>Estimado/a Propietario/a,</p>
                    
                    <p>Por medio de la presente, se le cita a la Asamblea {tipoAsamblea} que se realizará el día <strong>{fecha}</strong> a las <strong>{hora}</strong>.</p>
                    
                    <h3>Detalles de la Asamblea:</h3>
                    <ul>
                        <li><strong>Fecha:</strong> {fecha}</li>
                        <li><strong>Hora:</strong> {hora}</li>
                        <li><strong>Lugar:</strong> {lugar}</li>
                        <li><strong>Tipo:</strong> {tipoAsamblea}</li>
                    </ul>
                    
                    <h3>Tabla de Temas a Tratar:</h3>
                    {tabla}
                    
                    <p><strong>Importante:</strong> Su asistencia es fundamental para el buen funcionamiento del condominio. En caso de no poder asistir, puede otorgar poder a otro propietario.</p>
                    
                    <p>Saludos cordiales,<br>
                    Administración Condominio Los Molles</p>
                `
            }
        };
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return gapi.auth2.getAuthInstance().isSignedIn.get();
    }

    // Enviar email
    async sendEmail(to, subject, htmlBody, attachments = []) {
        if (!this.isAuthenticated()) {
            throw new Error('Usuario no autenticado');
        }

        try {
            // Crear el mensaje MIME
            const message = this.createMimeMessage(to, subject, htmlBody, attachments);
            
            // Codificar en base64
            const encodedMessage = btoa(unescape(encodeURIComponent(message)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            // Enviar el email
            const response = await gapi.client.gmail.users.messages.send({
                userId: 'me',
                resource: {
                    raw: encodedMessage
                }
            });

            return response.result;
        } catch (error) {
            console.error('Error enviando email:', error);
            throw error;
        }
    }

    // Crear mensaje MIME
    createMimeMessage(to, subject, htmlBody, attachments = []) {
        const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9);
        
        let message = [
            `From: ${this.fromEmail}`,
            `To: ${to}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            `Content-Type: multipart/mixed; boundary="${boundary}"`,
            '',
            `--${boundary}`,
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: quoted-printable',
            '',
            this.encodeQuotedPrintable(htmlBody),
            ''
        ].join('\r\n');

        // Agregar archivos adjuntos
        attachments.forEach(attachment => {
            message += [
                `--${boundary}`,
                `Content-Type: ${attachment.mimeType}`,
                `Content-Disposition: attachment; filename="${attachment.filename}"`,
                'Content-Transfer-Encoding: base64',
                '',
                attachment.data,
                ''
            ].join('\r\n');
        });

        message += `--${boundary}--`;
        
        return message;
    }

    // Codificar en quoted-printable
    encodeQuotedPrintable(str) {
        return str
            .replace(/[^\x20-\x7E]/g, (match) => {
                const hex = match.charCodeAt(0).toString(16).toUpperCase();
                return '=' + (hex.length === 1 ? '0' + hex : hex);
            })
            .replace(/(.{75})/g, '$1=\r\n');
    }

    // Enviar recordatorio de pago
    async sendRecordatorioPago(residente, periodo) {
        const template = this.templates.recordatorioPago;
        const [año, mes] = periodo.split('-');
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        const mesNombre = meses[parseInt(mes) - 1];
        const fechaVencimiento = `10 de ${mesNombre} ${año}`;
        
        const subject = template.subject
            .replace('{mes}', mesNombre)
            .replace('{año}', año);
            
        const body = template.body
            .replace(/{nombreResidente}/g, residente.nombreCompleto)
            .replace(/{nParcela}/g, residente.nParcela)
            .replace(/{montoGastoComun}/g, helpers.formatCurrency(residente.valorGastoComun))
            .replace(/{periodo}/g, `${mesNombre} ${año}`)
            .replace(/{fechaVencimiento}/g, fechaVencimiento)
            .replace(/{mes}/g, mesNombre)
            .replace(/{año}/g, año)
            .replace(/{mesVencimiento}/g, mesNombre);

        return await this.sendEmail(residente.email, subject, body);
    }

    // Enviar comprobante de pago
    async sendComprobantePago(residente, pago) {
        const template = this.templates.comprobantePago;
        
        const subject = template.subject
            .replace('{periodo}', pago.periodo);
            
        const body = template.body
            .replace(/{nombreResidente}/g, residente.nombreCompleto)
            .replace(/{nParcela}/g, pago.nParcela)
            .replace(/{periodo}/g, pago.periodo)
            .replace(/{montoPagado}/g, helpers.formatCurrency(pago.montoPagado))
            .replace(/{fechaPago}/g, helpers.formatDate(pago.fechaPago))
            .replace(/{metodoPago}/g, pago.metodoPago)
            .replace(/{estado}/g, pago.estado);

        return await this.sendEmail(residente.email, subject, body);
    }

    // Enviar estado de cuenta
    async sendEstadoCuenta(residente, pagos) {
        const template = this.templates.estadoCuenta;
        
        // Generar resumen financiero
        const resumenFinanciero = this.generateResumenFinanciero(pagos);
        
        const subject = template.subject
            .replace('{nParcela}', residente.nParcela);
            
        const body = template.body
            .replace(/{nombreResidente}/g, residente.nombreCompleto)
            .replace(/{nParcela}/g, residente.nParcela)
            .replace(/{email}/g, residente.email)
            .replace(/{valorGastoComun}/g, helpers.formatCurrency(residente.valorGastoComun))
            .replace('{resumenFinanciero}', resumenFinanciero);

        return await this.sendEmail(residente.email, subject, body);
    }

    // Enviar notificación de multa
    async sendNotificacionMulta(residente, multa) {
        const template = this.templates.notificacionMulta;
        
        const subject = template.subject
            .replace('{nParcela}', residente.nParcela);
            
        const body = template.body
            .replace(/{nombreResidente}/g, residente.nombreCompleto)
            .replace(/{nParcela}/g, residente.nParcela)
            .replace(/{fechaInfraccion}/g, helpers.formatDate(multa.fechaInfraccion))
            .replace(/{descripcion}/g, multa.descripcion)
            .replace(/{monto}/g, helpers.formatCurrency(multa.monto));

        return await this.sendEmail(residente.email, subject, body);
    }

    // Enviar citación a asamblea
    async sendCitacionAsamblea(residente, asamblea) {
        const template = this.templates.citacionAsamblea;
        
        const subject = template.subject
            .replace('{tipoAsamblea}', asamblea.tipo)
            .replace('{fecha}', helpers.formatDate(asamblea.fecha));
            
        const body = template.body
            .replace(/{tipoAsamblea}/g, asamblea.tipo)
            .replace(/{fecha}/g, helpers.formatDate(asamblea.fecha))
            .replace(/{hora}/g, asamblea.hora || '19:00')
            .replace(/{lugar}/g, asamblea.lugar || 'Sede Social del Condominio')
            .replace('{tabla}', asamblea.descripcion);

        return await this.sendEmail(residente.email, subject, body);
    }

    // Enviar citación a todos los residentes
    async sendCitacionTodasParcelas(asamblea) {
        const residentes = await sheetsAPI.getResidentes();
        const residentesActivos = residentes.filter(r => r.Estado === 'Activo');
        
        const results = [];
        
        for (const residente of residentesActivos) {
            try {
                const result = await this.sendCitacionAsamblea(residente, asamblea);
                results.push({ residente: residente.nombreCompleto, success: true, result });
                
                // Registrar comunicación
                await sheetsAPI.addComunicacion({
                    idResidente: residente.ID_Residente,
                    nParcela: residente.N_Parcela,
                    nombreCompleto: residente.NombreCompleto,
                    email: residente.Email,
                    fechaEnvio: helpers.getCurrentDateTime(),
                    asunto: `Citación a Asamblea ${asamblea.tipo}`,
                    mensaje: 'Citación enviada automáticamente'
                });
                
                // Pausa para evitar límites de rate
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Error enviando citación a ${residente.nombreCompleto}:`, error);
                results.push({ residente: residente.nombreCompleto, success: false, error: error.message });
            }
        }
        
        return results;
    }

    // Enviar recordatorios automáticos (día 25 de cada mes)
    async sendRecordatoriosAutomaticos() {
        const residentes = await sheetsAPI.getResidentes();
        const residentesActivos = residentes.filter(r => r.Estado === 'Activo');
        
        const hoy = new Date();
        const proximoMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
        const periodo = `${proximoMes.getFullYear()}-${(proximoMes.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const results = [];
        
        for (const residente of residentesActivos) {
            try {
                const result = await this.sendRecordatorioPago(residente, periodo);
                results.push({ residente: residente.nombreCompleto, success: true, result });
                
                // Registrar comunicación
                await sheetsAPI.addComunicacion({
                    idResidente: residente.ID_Residente,
                    nParcela: residente.N_Parcela,
                    nombreCompleto: residente.NombreCompleto,
                    email: residente.Email,
                    fechaEnvio: helpers.getCurrentDateTime(),
                    asunto: `Recordatorio de Pago - ${periodo}`,
                    mensaje: 'Recordatorio enviado automáticamente'
                });
                
                // Pausa para evitar límites de rate
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Error enviando recordatorio a ${residente.nombreCompleto}:`, error);
                results.push({ residente: residente.nombreCompleto, success: false, error: error.message });
            }
        }
        
        return results;
    }

    // Generar resumen financiero para estado de cuenta
    generateResumenFinanciero(pagos) {
        let html = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 20px 0;">';
        html += '<tr><th>Período</th><th>Monto Pagado</th><th>Estado</th><th>Fecha Pago</th></tr>';
        
        pagos.forEach(pago => {
            html += `<tr>
                <td>${pago.Periodo}</td>
                <td>${helpers.formatCurrency(pago.MontoPagado)}</td>
                <td>${pago.Estado}</td>
                <td>${pago.FechaPago ? helpers.formatDate(pago.FechaPago) : '-'}</td>
            </tr>`;
        });
        
        html += '</table>';
        return html;
    }

    // Enviar email personalizado
    async sendCustomEmail(to, subject, message) {
        const htmlBody = `
            <h2>Condominio Los Molles</h2>
            <div style="white-space: pre-wrap;">${message}</div>
            <br>
            <p>Saludos cordiales,<br>
            Administración Condominio Los Molles</p>
        `;
        
        return await this.sendEmail(to, subject, htmlBody);
    }
}

// Crear instancia global
window.gmailAPI = new GmailAPI();

// Exportar para uso en otros módulos
window.GmailAPI = GmailAPI;

