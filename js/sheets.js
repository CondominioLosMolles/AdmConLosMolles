// ===== INTEGRACIÓN CON GOOGLE SHEETS =====

class GoogleSheetsAPI {
    constructor() {
        this.spreadsheetId = '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8';
        this.sheets = {
            residentes: 'Residentes',
            pagos: 'Pagos_GC',
            egresos: 'Egresos',
            mantenciones: 'Mantenciones',
            multas: 'Multas',
            asambleas: 'Asambleas',
            comunicaciones: 'Comunicaciones'
        };
        this.cache = {};
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return gapi.auth2.getAuthInstance().isSignedIn.get();
    }

    // Obtener datos de una hoja
    async getSheetData(sheetName, range = '') {
        if (!this.isAuthenticated()) {
            throw new Error('Usuario no autenticado');
        }

        const cacheKey = `${sheetName}_${range}`;
        const cached = this.cache[cacheKey];
        
        // Verificar cache
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const fullRange = range ? `${sheetName}!${range}` : sheetName;
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: fullRange,
                valueRenderOption: 'UNFORMATTED_VALUE',
                dateTimeRenderOption: 'FORMATTED_STRING'
            });

            const values = response.result.values || [];
            
            // Convertir a objetos si hay datos
            let data = [];
            if (values.length > 1) {
                const headers = values[0];
                data = values.slice(1).map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index] || '';
                    });
                    return obj;
                });
            }

            // Guardar en cache
            this.cache[cacheKey] = {
                data,
                timestamp: Date.now()
            };

            return data;
        } catch (error) {
            console.error(`Error obteniendo datos de ${sheetName}:`, error);
            throw error;
        }
    }

    // Agregar fila a una hoja
    async appendRow(sheetName, values) {
        if (!this.isAuthenticated()) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const response = await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: sheetName,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [values]
                }
            });

            // Limpiar cache relacionado
            this.clearSheetCache(sheetName);

            return response.result;
        } catch (error) {
            console.error(`Error agregando fila a ${sheetName}:`, error);
            throw error;
        }
    }

    // Actualizar rango de celdas
    async updateRange(sheetName, range, values) {
        if (!this.isAuthenticated()) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const response = await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!${range}`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: values
                }
            });

            // Limpiar cache relacionado
            this.clearSheetCache(sheetName);

            return response.result;
        } catch (error) {
            console.error(`Error actualizando rango en ${sheetName}:`, error);
            throw error;
        }
    }

    // Eliminar fila
    async deleteRow(sheetName, rowIndex) {
        if (!this.isAuthenticated()) {
            throw new Error('Usuario no autenticado');
        }

        try {
            // Primero obtener el ID de la hoja
            const sheetId = await this.getSheetId(sheetName);
            
            const response = await gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [{
                        deleteDimension: {
                            range: {
                                sheetId: sheetId,
                                dimension: 'ROWS',
                                startIndex: rowIndex,
                                endIndex: rowIndex + 1
                            }
                        }
                    }]
                }
            });

            // Limpiar cache relacionado
            this.clearSheetCache(sheetName);

            return response.result;
        } catch (error) {
            console.error(`Error eliminando fila en ${sheetName}:`, error);
            throw error;
        }
    }

    // Obtener ID de una hoja
    async getSheetId(sheetName) {
        try {
            const response = await gapi.client.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });

            const sheet = response.result.sheets.find(s => s.properties.title === sheetName);
            return sheet ? sheet.properties.sheetId : null;
        } catch (error) {
            console.error(`Error obteniendo ID de hoja ${sheetName}:`, error);
            throw error;
        }
    }

    // Limpiar cache de una hoja específica
    clearSheetCache(sheetName) {
        Object.keys(this.cache).forEach(key => {
            if (key.startsWith(sheetName)) {
                delete this.cache[key];
            }
        });
    }

    // Limpiar todo el cache
    clearCache() {
        this.cache = {};
    }

    // Métodos específicos para cada hoja

    // RESIDENTES
    async getResidentes() {
        return await this.getSheetData(this.sheets.residentes);
    }

    async addResidente(residente) {
        const values = [
            '', // ID_Residente (autoincremental)
            residente.nombreCompleto,
            residente.rut,
            residente.nParcela,
            residente.direccion,
            residente.email,
            residente.telefono,
            residente.estado || 'Activo',
            residente.valorGastoComun
        ];
        return await this.appendRow(this.sheets.residentes, values);
    }

    async updateResidente(rowIndex, residente) {
        const values = [[
            '', // ID_Residente (mantener)
            residente.nombreCompleto,
            residente.rut,
            residente.nParcela,
            residente.direccion,
            residente.email,
            residente.telefono,
            residente.estado,
            residente.valorGastoComun
        ]];
        return await this.updateRange(this.sheets.residentes, `A${rowIndex + 2}:I${rowIndex + 2}`, values);
    }

    async deleteResidente(rowIndex) {
        return await this.deleteRow(this.sheets.residentes, rowIndex + 1); // +1 por el header
    }

    // PAGOS
    async getPagos() {
        return await this.getSheetData(this.sheets.pagos);
    }

    async addPago(pago) {
        const values = [
            '', // ID_Pago (autoincremental)
            pago.nombreResidente,
            pago.nParcela,
            pago.valorGastoComun,
            pago.periodo,
            pago.fechaVencimiento,
            pago.montoPagado,
            pago.saldoPendiente,
            pago.interes,
            pago.timc,
            pago.multa,
            pago.mesesImpagos,
            pago.deudaTotal,
            pago.fechaPago,
            pago.metodoPago,
            pago.estado,
            pago.idComprobante || ''
        ];
        return await this.appendRow(this.sheets.pagos, values);
    }

    async updatePago(rowIndex, pago) {
        const values = [[
            '', // ID_Pago (mantener)
            pago.nombreResidente,
            pago.nParcela,
            pago.valorGastoComun,
            pago.periodo,
            pago.fechaVencimiento,
            pago.montoPagado,
            pago.saldoPendiente,
            pago.interes,
            pago.timc,
            pago.multa,
            pago.mesesImpagos,
            pago.deudaTotal,
            pago.fechaPago,
            pago.metodoPago,
            pago.estado,
            pago.idComprobante || ''
        ]];
        return await this.updateRange(this.sheets.pagos, `A${rowIndex + 2}:Q${rowIndex + 2}`, values);
    }

    // EGRESOS
    async getEgresos() {
        return await this.getSheetData(this.sheets.egresos);
    }

    async addEgreso(egreso) {
        const values = [
            '', // ID_Egreso (autoincremental)
            egreso.fecha,
            egreso.categoria,
            egreso.descripcion,
            egreso.proveedor,
            egreso.rutProveedor,
            egreso.monto,
            egreso.idFactura || ''
        ];
        return await this.appendRow(this.sheets.egresos, values);
    }

    // MANTENCIONES
    async getMantenciones() {
        return await this.getSheetData(this.sheets.mantenciones);
    }

    async addMantencion(mantencion) {
        const values = [
            '', // ID_Mantencion (autoincremental)
            mantencion.fecha,
            mantencion.encargado,
            mantencion.tipo,
            mantencion.descripcion,
            mantencion.estado || 'Pendiente',
            mantencion.costoTotal || 0,
            mantencion.idComprobante || ''
        ];
        return await this.appendRow(this.sheets.mantenciones, values);
    }

    // MULTAS
    async getMultas() {
        return await this.getSheetData(this.sheets.multas);
    }

    async addMulta(multa) {
        const values = [
            '', // ID_Multa (autoincremental)
            multa.idResidente,
            multa.fechaInfraccion,
            multa.descripcion,
            multa.monto,
            multa.estado || 'Pendiente',
            multa.fechaPago || ''
        ];
        return await this.appendRow(this.sheets.multas, values);
    }

    // ASAMBLEAS
    async getAsambleas() {
        return await this.getSheetData(this.sheets.asambleas);
    }

    async addAsamblea(asamblea) {
        const values = [
            '', // ID_Asamblea (autoincremental)
            asamblea.fecha,
            asamblea.tipo,
            asamblea.descripcion,
            asamblea.estado || 'Programada',
            asamblea.idActa || ''
        ];
        return await this.appendRow(this.sheets.asambleas, values);
    }

    // COMUNICACIONES
    async getComunicaciones() {
        return await this.getSheetData(this.sheets.comunicaciones);
    }

    async addComunicacion(comunicacion) {
        const values = [
            '', // ID_Comunicacion (autoincremental)
            comunicacion.idResidente,
            comunicacion.nParcela,
            comunicacion.nombreCompleto,
            comunicacion.email,
            comunicacion.fechaEnvio,
            comunicacion.asunto,
            comunicacion.mensaje
        ];
        return await this.appendRow(this.sheets.comunicaciones, values);
    }

    // Métodos de búsqueda y filtrado
    async findResidenteByParcela(nParcela) {
        const residentes = await this.getResidentes();
        return residentes.find(r => r.N_Parcela == nParcela);
    }

    async findResidenteByRUT(rut) {
        const residentes = await this.getResidentes();
        return residentes.find(r => r.RUT === rut);
    }

    async getPagosByParcela(nParcela) {
        const pagos = await this.getPagos();
        return pagos.filter(p => p.N_Parcela == nParcela);
    }

    async getPagosByPeriodo(periodo) {
        const pagos = await this.getPagos();
        return pagos.filter(p => p.Periodo === periodo);
    }

    // Métodos de estadísticas
    async getResumenFinanciero() {
        const [pagos, egresos] = await Promise.all([
            this.getPagos(),
            this.getEgresos()
        ]);

        const totalIngresos = pagos.reduce((sum, p) => sum + parseFloat(p.MontoPagado || 0), 0);
        const totalEgresos = egresos.reduce((sum, e) => sum + parseFloat(e.Monto || 0), 0);

        return {
            totalIngresos,
            totalEgresos,
            saldoCaja: totalIngresos - totalEgresos
        };
    }

    async getResumenMorosidad() {
        const residentes = await this.getResidentes();
        const morosos = residentes.filter(r => r.Estado === 'Moroso');
        
        return {
            totalResidentes: residentes.length,
            residentesMorosos: morosos.length,
            tasaMorosidad: (morosos.length / residentes.length) * 100
        };
    }
}

// Crear instancia global
window.sheetsAPI = new GoogleSheetsAPI();

// Exportar para uso en otros módulos
window.GoogleSheetsAPI = GoogleSheetsAPI;

