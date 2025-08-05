# 📊 Sistema de Morosidad Mes a Mes

## 🎯 Concepto Principal

El sistema calcula la morosidad basándose en **períodos mensuales específicos** desde la **fecha de ingreso inicial** del cliente, no en el último pago.

## 📅 Cómo Funciona

### 1. Períodos Mensuales
- Se calculan desde la **fecha de ingreso inicial** del cliente
- Cada período dura **X días** (configurado en `diasVencimiento`, por defecto 30)
- Los períodos son **consecutivos** sin superposición

**Ejemplo:** Cliente ingresó el 15 de enero 2024
- **Período 1:** 15 ene - 14 feb
- **Período 2:** 15 feb - 14 mar  
- **Período 3:** 15 mar - 14 abr
- **Período 4:** 15 abr - 14 may
- Y así sucesivamente...

### 2. Estados por Período

Cada período puede tener uno de dos estados:

#### ✅ CON PAGO
- El cliente **SÍ pagó** en ese período específico
- Se registró un pago confirmado dentro de las fechas del período
- No está en mora para ese período

#### ❌ SIN PAGO  
- El cliente **NO pagó** en ese período específico
- No hay pagos confirmados en las fechas del período
- Está en mora para ese período (si ya venció)

### 3. Cálculo de Morosidad

```javascript
// Solo se cuentan períodos SIN PAGO que ya vencieron
const periodosSinPago = periodos.filter(p => p.estado === 'SIN_PAGO' && p.vencido);

// Cada período sin pago = 1 mes adeudado
const mesesAdeudados = periodosSinPago.length;

// Deuda total = Períodos sin pago × Precio mensual
const deudaTotal = mesesAdeudados * cliente.precio;
```

## 🔧 Implementación Técnica

### Funciones Principales

#### `calcularPeriodosMensuales(fechaIngreso, diasVencimiento)`
Genera todos los períodos mensuales desde la fecha de ingreso hasta hoy.

#### `calcularEstadoPeriodos(periodos, pagos)`
Determina si cada período tiene estado CON PAGO o SIN PAGO.

#### `calcularEstadoCliente(cliente, pagos)`
Calcula el estado general del cliente basado en sus períodos.

### Estados del Cliente

1. **Al día:** Sin períodos vencidos sin pagar
2. **Por vencer:** 1 período vencido, menos de 5 días
3. **Vencido:** 1-2 períodos vencidos
4. **Moroso:** 3+ períodos vencidos

## 📋 Ejemplo Práctico

**Cliente:** Juan Pérez  
**Fecha ingreso:** 1 de enero 2024  
**Precio mensual:** $50,000  
**Días vencimiento:** 30  

### Períodos Calculados:
| Período | Inicio | Fin | Vencimiento | Estado | Pago |
|---------|--------|-----|-------------|--------|------|
| Mes 1 | 01/01 | 31/01 | 31/01 | ✅ CON PAGO | $50,000 (25/01) |
| Mes 2 | 01/02 | 02/03 | 02/03 | ❌ SIN PAGO | - |
| Mes 3 | 03/03 | 01/04 | 01/04 | ✅ CON PAGO | $50,000 (28/03) |
| Mes 4 | 02/04 | 01/05 | 01/05 | ❌ SIN PAGO | - |
| Mes 5 | 02/05 | 31/05 | 31/05 | ❌ SIN PAGO | - |

### Resultado:
- **Períodos sin pago:** 3 (Mes 2, 4, 5)
- **Meses adeudados:** 3
- **Deuda total:** $150,000
- **Estado:** MOROSO

## 🎨 Interfaz de Usuario

### En la Lista de Clientes
- **Estado visual:** Chip con color según morosidad
- **Texto:** "MOROSO: 3 meses - $150,000"
- **Botón:** "Ver Períodos" para detalle completo

### Detalle de Períodos
- **Tabla completa** de todos los períodos
- **Estados visuales** CON PAGO/SIN PAGO
- **Días vencidos** por período
- **Pagos registrados** con fechas y montos

## 🔄 Diferencias con Sistema Anterior

### Sistema Anterior (Lineal)
```
Último pago + días vencimiento = próximo vencimiento
```

### Sistema Nuevo (Mes a Mes)
```
Fecha ingreso → Período 1 → Período 2 → Período 3...
Cada período: CON PAGO o SIN PAGO
```

## 📊 Ventajas del Nuevo Sistema

1. **Precisión:** Cada mes se evalúa individualmente
2. **Transparencia:** Se ve exactamente qué meses debe
3. **Justicia:** No se "perdona" deuda por pagar tarde
4. **Control:** Administrador ve el historial completo
5. **Flexibilidad:** Permite pagos adelantados y atrasados

## 🚀 Uso en la Aplicación

1. **Crear cliente** con fecha de ingreso
2. **Registrar pagos** normalmente
3. **Ver estado** en lista de clientes
4. **Hacer clic** en "Ver Períodos" para detalle
5. **Exportar reportes** con nueva información

---

**Desarrollado para gestión precisa de cocheras** 🏠