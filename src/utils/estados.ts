export const getColorEstadoSolicitud = (estado: string): any => {
  switch (estado) {
    case 'pendiente':
      return 'warning'
    case 'con_presupuestos':
      return 'info'
    case 'aprobada':
      return 'success'
    case 'rechazada':
    case 'cancelada':
      return 'error'
    case 'pendiente_aprobacion_presupuestos':
      return 'warning'
    default:
      return 'gray'
  }
}

export const getColorEstadoCompra = (estado: string): any => {
  switch (estado) {
    case 'aprobado':
      return 'info'
    case 'pendiente_compra':
      return 'warning'
    case 'compra_realizada':
      return 'info'
    case 'pendiente_pago':
      return 'warning'
    case 'pago_parcial':
      return 'warning'
    case 'pagado_total':
      return 'success'
    default:
      return 'gray'
  }
}

export const getLabelEstado = (estado: string) => {
  const labels: Record<string, string> = {
    pendiente: 'Pendiente',
    con_presupuestos: 'Con Presupuestos',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    cancelada: 'Cancelada',
    pendiente_aprobacion_presupuestos: 'Pendiente de Aprobación de Presupuestos',
    aprobado: 'Aprobado',
    pendiente_compra: 'Pendiente de Compra',
    compra_realizada: 'Compra Realizada',
    pendiente_pago: 'Pendiente de Pago',
    pago_parcial: 'Pago Parcial',
    pagado_total: 'Pagado Total',
  }
  return labels[estado] || estado
}

export const getRolLabel = (rol: string) => {
  const roles: Record<string, string> = {
    area: 'Área Solicitante',
    compras: 'Oficina de Compras',
    aprobacion: 'Aprobación',
    tribunal_cuentas: 'Tribunal de Cuentas',
    jefa_comunal: 'Jefa Comunal',
  }
  return roles[rol] || rol
}
