import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatCurrency = (monto: number, moneda: string = 'ARS'): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 2,
  }).format(monto)
}

export const formatDate = (date: string | Date): string => {
  if (!date) return '-'
  return format(new Date(date), 'dd/MM/yyyy', { locale: es })
}

export const formatDateTime = (date: string | Date): string => {
  if (!date) return '-'
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es })
}

export const diasVencida = (fecha: string): number => {
  if (!fecha) return 0
  const diff = differenceInDays(new Date(), new Date(fecha))
  return diff > 0 ? diff : 0
}
