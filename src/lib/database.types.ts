export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      areas: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          activa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      usuarios: {
        Row: {
          id: string
          nombre: string
          email: string
          password_hash: string
          rol: 'area' | 'compras' | 'aprobacion' | 'tribunal_cuentas' | 'jefa_comunal'
          area_id: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          email: string
          password_hash: string
          rol: 'area' | 'compras' | 'aprobacion' | 'tribunal_cuentas' | 'jefa_comunal'
          area_id?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          email?: string
          password_hash?: string
          rol?: 'area' | 'compras' | 'aprobacion' | 'tribunal_cuentas' | 'jefa_comunal'
          area_id?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      proveedores: {
        Row: {
          id: string
          razon_social: string
          nombre_fantasia: string | null
          cuit: string
          condicion_fiscal: 'responsable_inscripto' | 'monotributista' | 'exento' | 'consumidor_final'
          rubro: string | null
          email: string | null
          telefono: string | null
          direccion: string | null
          ciudad: string | null
          provincia: string
          codigo_postal: string | null
          contacto_nombre: string | null
          contacto_telefono: string | null
          contacto_email: string | null
          numero_cuenta_banco: string | null
          banco: string | null
          cbu: string | null
          alias_cbu: string | null
          activo: boolean
          inhabilitado: boolean
          motivo_inhabilitacion: string | null
          observaciones: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          razon_social: string
          nombre_fantasia?: string | null
          cuit: string
          condicion_fiscal?: 'responsable_inscripto' | 'monotributista' | 'exento' | 'consumidor_final'
          rubro?: string | null
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          ciudad?: string | null
          provincia?: string
          codigo_postal?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          contacto_email?: string | null
          numero_cuenta_banco?: string | null
          banco?: string | null
          cbu?: string | null
          alias_cbu?: string | null
          activo?: boolean
          inhabilitado?: boolean
          motivo_inhabilitacion?: string | null
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          razon_social?: string
          nombre_fantasia?: string | null
          cuit?: string
          condicion_fiscal?: 'responsable_inscripto' | 'monotributista' | 'exento' | 'consumidor_final'
          rubro?: string | null
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          ciudad?: string | null
          provincia?: string
          codigo_postal?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          contacto_email?: string | null
          numero_cuenta_banco?: string | null
          banco?: string | null
          cbu?: string | null
          alias_cbu?: string | null
          activo?: boolean
          inhabilitado?: boolean
          motivo_inhabilitacion?: string | null
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      solicitudes: {
        Row: {
          id: string
          area_id: string
          solicitante_id: string
          aprobado_por: string | null
          numero_expediente: string | null
          titulo: string
          descripcion: string
          estado: 'pendiente' | 'para_cotizar' | 'con_presupuestos' | 'aprobada' | 'pendiente_aprobacion_presupuestos' | 'rechazada' | 'cancelada' | 'finalizada'
          observaciones: string | null
          fecha_aprobacion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          area_id: string
          solicitante_id: string
          aprobado_por?: string | null
          numero_expediente?: string | null
          titulo: string
          descripcion: string
          estado?: 'pendiente' | 'para_cotizar' | 'con_presupuestos' | 'aprobada' | 'pendiente_aprobacion_presupuestos' | 'rechazada' | 'cancelada' | 'finalizada'
          observaciones?: string | null
          fecha_aprobacion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          area_id?: string
          solicitante_id?: string
          aprobado_por?: string | null
          numero_expediente?: string | null
          titulo?: string
          descripcion?: string
          estado?: 'pendiente' | 'para_cotizar' | 'con_presupuestos' | 'aprobada' | 'pendiente_aprobacion_presupuestos' | 'rechazada' | 'cancelada' | 'finalizada'
          observaciones?: string | null
          fecha_aprobacion?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      presupuestos: {
        Row: {
          id: string
          solicitud_id: string
          cargado_por: string
          proveedor_id: string
          monto: number
          moneda: string
          descripcion: string | null
          archivo_url: string | null
          estado: 'pendiente' | 'aprobado' | 'rechazado'
          aprobado: boolean
          aprobado_por: string | null
          fecha_aprobacion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          solicitud_id: string
          cargado_por: string
          proveedor_id: string
          monto: number
          moneda: string
          descripcion?: string | null
          archivo_url?: string | null
          estado?: 'pendiente' | 'aprobado' | 'rechazado'
          aprobado?: boolean
          aprobado_por?: string | null
          fecha_aprobacion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          solicitud_id?: string
          cargado_por?: string
          proveedor_id?: string
          monto?: number
          moneda?: string
          descripcion?: string | null
          archivo_url?: string | null
          estado?: 'pendiente' | 'aprobado' | 'rechazado'
          aprobado?: boolean
          aprobado_por?: string | null
          fecha_aprobacion?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      compras: {
        Row: {
          id: string
          solicitud_id: string
          presupuesto_id: string
          registrado_por: string | null
          aprobado_por_tribunal: string | null
          aprobado_por_jefa: string | null
          fecha_aprobacion_tribunal: string | null
          fecha_aprobacion_jefa: string | null
          tipo: 'directa' | 'tribunal'
          estado: 'aprobado' | 'pendiente_compra' | 'compra_realizada' | 'finalizada' | 'pendiente_pago' | 'pago_parcial' | 'pagado_total'
          monto_total: number
          requiere_tribunal: boolean
          forma_pago: string | null
          comprobante_url: string | null
          fecha_compra: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          solicitud_id: string
          presupuesto_id: string
          registrado_por?: string | null
          aprobado_por_tribunal?: string | null
          aprobado_por_jefa?: string | null
          fecha_aprobacion_tribunal?: string | null
          fecha_aprobacion_jefa?: string | null
          tipo?: 'directa' | 'tribunal'
          estado?: 'aprobado' | 'pendiente_compra' | 'compra_realizada' | 'finalizada' | 'pendiente_pago' | 'pago_parcial' | 'pagado_total'
          monto_total: number
          requiere_tribunal?: boolean
          forma_pago?: string | null
          comprobante_url?: string | null
          fecha_compra?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          solicitud_id?: string
          presupuesto_id?: string
          registrado_por?: string | null
          aprobado_por_tribunal?: string | null
          aprobado_por_jefa?: string | null
          fecha_aprobacion_tribunal?: string | null
          fecha_aprobacion_jefa?: string | null
          tipo?: 'directa' | 'tribunal'
          estado?: 'aprobado' | 'pendiente_compra' | 'compra_realizada' | 'finalizada' | 'pendiente_pago' | 'pago_parcial' | 'pagado_total'
          monto_total?: number
          requiere_tribunal?: boolean
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pagos: {
        Row: {
          id: string
          compra_id: string
          registrado_por: string | null
          numero_cuota: number
          monto: number
          fecha_vencimiento: string
          fecha_pago_real: string | null
          estado: 'pendiente' | 'pagado' | 'vencido'
          medio_pago: string | null
          comprobante_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          compra_id: string
          registrado_por?: string | null
          numero_cuota: number
          monto: number
          fecha_vencimiento: string
          fecha_pago_real?: string | null
          estado?: 'pendiente' | 'pagado' | 'vencido'
          medio_pago?: string | null
          comprobante_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          compra_id?: string
          registrado_por?: string | null
          numero_cuota?: number
          monto?: number
          fecha_vencimiento?: string
          fecha_pago_real?: string | null
          estado?: 'pendiente' | 'pagado' | 'vencido'
          medio_pago?: string | null
          comprobante_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cuenta_corriente_proveedores: {
        Row: {
          id: string
          proveedor_id: string
          compra_id: string | null
          cuota_id: string | null
          pago_id: string | null
          tipo_movimiento: 'factura' | 'pago_parcial' | 'pago_total' | 'nota_credito' | 'nota_debito' | 'ajuste'
          monto: number
          signo: number
          saldo_parcial: number | null
          numero_comprobante: string | null
          fecha_comprobante: string
          descripcion: string | null
          archivo_url: string | null
          registrado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          proveedor_id: string
          compra_id?: string | null
          cuota_id?: string | null
          pago_id?: string | null
          tipo_movimiento: 'factura' | 'pago_parcial' | 'pago_total' | 'nota_credito' | 'nota_debito' | 'ajuste'
          monto: number
          signo: number
          saldo_parcial?: number | null
          numero_comprobante?: string | null
          fecha_comprobante?: string
          descripcion?: string | null
          archivo_url?: string | null
          registrado_por?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          proveedor_id?: string
          compra_id?: string | null
          cuota_id?: string | null
          tipo_movimiento?: 'factura' | 'pago_parcial' | 'pago_total' | 'nota_credito' | 'nota_debito' | 'ajuste'
          monto?: number
          signo?: number
          saldo_parcial?: number | null
          numero_comprobante?: string | null
          fecha_comprobante?: string
          descripcion?: string | null
          archivo_url?: string | null
          registrado_por?: string
          created_at?: string
          updated_at?: string
        }
      }
      rubros_proveedores: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    },
    Enums: {
      rol_usuario: 'area' | 'compras' | 'aprobacion' | 'tribunal_cuentas' | 'jefa_comunal'
      estado_solicitud: 'pendiente' | 'con_presupuestos' | 'aprobada' | 'pendiente_aprobacion_presupuestos' | 'cancelada'
      estado_presupuesto: 'pendiente' | 'aprobado' | 'rechazado'
      estado_compra: 'aprobado' | 'pendiente_compra' | 'compra_realizada' | 'pendiente_pago' | 'pago_parcial' | 'pagado_total'
      tipo_movimiento_cc: 'factura' | 'pago_parcial' | 'pago_total' | 'nota_credito' | 'nota_debito' | 'ajuste'
      condicion_fiscal: 'responsable_inscripto' | 'monotributista' | 'exento' | 'consumidor_final'
    }
  }
}
