# FinanciaApp — Design System & UI Guidelines

> Leer este archivo SIEMPRE antes de tocar cualquier componente visual.
> Es la fuente de verdad del diseño. No improvisar colores, espaciados ni tipografía.

---

## 1. Identidad Visual

FinanciaApp es una app de finanzas personales para profesionales españoles de 25-45 años.
El tono visual es: **oscuro, preciso, confiable**. No es una app de banco corporativo
ni una fintech millennial con colores neón. Es sobria pero accesible.

**Palabra clave de diseño:** claridad. Cada elemento debe justificar su presencia.

---

## 2. Paleta de Colores

### Colores base (fondo)

```
--bg-primary:    #0D1117   ← fondo de página principal
--bg-secondary:  #161C24   ← fondo de cards y panels
--bg-tertiary:   #1E2530   ← fondo de inputs y elementos elevados
--bg-hover:      #242D3A   ← hover states
```

### Color de acento (verde)

```
--accent:        #1D9E75   ← CTA principal, elementos activos, datos positivos
--accent-light:  #5DCAA5   ← texto sobre fondo oscuro, iconos secundarios
--accent-muted:  rgba(29, 158, 117, 0.12)  ← fondo de pills y badges
--accent-border: rgba(29, 158, 117, 0.30)  ← borde de pills y badges
```

### Texto

```
--text-primary:   #FFFFFF   ← headings, valores importantes
--text-secondary: #C5D0DC   ← cuerpo de texto, labels
--text-muted:     #8A9AAD   ← placeholders, texto de ayuda, subtítulos
--text-disabled:  #3D4F61   ← elementos deshabilitados
```

### Bordes

```
--border-subtle:  rgba(255, 255, 255, 0.06)  ← separadores, divisores
--border-default: rgba(255, 255, 255, 0.10)  ← bordes de cards e inputs
--border-strong:  rgba(255, 255, 255, 0.18)  ← bordes de elementos activos
```

### Semánticos

```
--color-positive: #1D9E75   ← patrimonio positivo, variación al alza
--color-negative: #E24B4A   ← deuda, variación a la baja, alertas críticas
--color-warning:  #EF9F27   ← alertas moderadas, atención
--color-info:     #378ADD   ← información neutral, tooltips
```

### NUNCA usar

- Blanco puro (#FFFFFF) como fondo
- Negro puro (#000000) como fondo
- Colores sin opacidad sobre fondos oscuros (usar rgba siempre)
- Más de 2 colores de acento en el mismo componente

---

## 3. Tipografía

### Fuente

```css
font-family: var(--font-sans); /* Anthropic Sans / sistema */
```

### Escala tipográfica

```
Display:    34-40px  font-weight: 700   ← títulos de onboarding, heroes
H1:         24-28px  font-weight: 600   ← títulos de página
H2:         18-20px  font-weight: 600   ← títulos de sección
H3:         15-16px  font-weight: 500   ← títulos de card
Body:       14-15px  font-weight: 400   ← texto general
Small:      12-13px  font-weight: 400   ← labels, captions, hints
Micro:      11px     font-weight: 400   ← solo para datos muy densos
```

### Reglas tipográficas

- **Siempre sentence case.** Nunca Title Case en labels o botones.
- Los números financieros (€) van en font-weight: 500 o 600, nunca 400.
- Los porcentajes positivos van en --color-positive, negativos en --color-negative.
- No usar más de 2 pesos de fuente en el mismo componente.

### Formato de números

```javascript
// SIEMPRE usar esto para euros:
new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
}).format(value)
// → "1.234,56 €"

// Para porcentajes:
`${value.toFixed(1)} %`;
// → "34,4 %"
```

---

## 4. Espaciado

Sistema de 4px base:

```
xs:   4px   ← gap entre elementos inline muy pequeños
sm:   8px   ← gap interno de componentes compactos
md:   12px  ← gap entre elementos relacionados
lg:   16px  ← padding interno de cards
xl:   20px  ← separación entre secciones
2xl:  24px  ← padding de páginas móvil
3xl:  32px  ← separación entre bloques mayores
4xl:  48px  ← padding de heroes
```

### Padding de página

```
Móvil:    padding: 0 20px
Desktop:  padding: 0 24px
```

---

## 5. Componentes

### Cards

```css
background: var(--bg-secondary); /* #161C24 */
border: 0.5px solid var(--border-default); /* rgba(255,255,255,0.10) */
border-radius: 16px; /* --border-radius-lg */
padding: 16px 20px;
```

Cards elevadas (modales, overlays):

```css
background: #1a2030;
border: 0.5px solid rgba(255, 255, 255, 0.14);
border-radius: 20px;
```

### Inputs

```css
background: var(--bg-tertiary); /* #1E2530 */
border: 0.5px solid var(--border-default);
border-radius: 12px;
padding: 14px 16px;
font-size: 15px;
color: var(--text-primary);

/* Focus: */
border-color: rgba(29, 158, 117, 0.5);
outline: none;
```

### Botón primario (CTA)

```css
background: #1d9e75;
border: none;
border-radius: 14px;
padding: 15px 24px;
font-size: 15px;
font-weight: 600;
color: #ffffff;
width: 100%; /* en móvil siempre full-width */
```

### Botón secundario

```css
background: transparent;
border: 0.5px solid var(--border-default);
border-radius: 14px;
padding: 14px 24px;
font-size: 15px;
font-weight: 500;
color: var(--text-secondary);
```

### Botón destructivo

```css
background: transparent;
border: 0.5px solid rgba(226, 75, 74, 0.3);
color: #e24b4a;
border-radius: 14px;
padding: 14px 24px;
```

### Pills / Badges

```css
/* Acento (positivo / activo): */
background: rgba(29, 158, 117, 0.12);
border: 0.5px solid rgba(29, 158, 117, 0.3);
color: #1d9e75;
border-radius: 20px;
padding: 4px 12px;
font-size: 12px;
font-weight: 500;

/* Neutro: */
background: rgba(255, 255, 255, 0.06);
border: 0.5px solid rgba(255, 255, 255, 0.1);
color: var(--text-muted);
```

### KPI Cards (métricas del dashboard)

```css
background: var(--bg-secondary);
border: 0.5px solid var(--border-default);
border-radius: 16px;
padding: 16px;

/* Label: */
font-size: 12px;
color: var(--text-muted);
margin-bottom: 6px;

/* Valor: */
font-size: 22px;
font-weight: 600;
color: var(--text-primary);

/* Variación: */
font-size: 12px;
color: var(--color-positive) | var(--color-negative);
```

### Tabla de datos

```css
/* Header: */
font-size: 12px;
font-weight: 500;
color: var(--text-muted);
text-transform: none; /* sentence case */
padding: 8px 12px;
border-bottom: 0.5px solid var(--border-subtle);

/* Celda: */
font-size: 13px;
color: var(--text-secondary);
padding: 10px 12px;
border-bottom: 0.5px solid var(--border-subtle);

/* Columna destacada (patrimonio neto, totales): */
font-weight: 600;
color: var(--text-primary);
background: rgba(29, 158, 117, 0.06);
```

### Navegación (tabs)

```css
/* Tab activa: */
color: var(--text-primary);
border-bottom: 2px solid #1d9e75;
font-weight: 500;

/* Tab inactiva: */
color: var(--text-muted);
border-bottom: 2px solid transparent;
```

### Bottom Navigation Bar (móvil)

```css
background: #161c24;
border-top: 0.5px solid rgba(255, 255, 255, 0.08);
padding: 8px 0 16px; /* 16px extra por safe area iOS */

/* Icono activo: */
color: #1d9e75;

/* Icono inactivo: */
color: #3d4f61;
```

---

## 6. Iconografía

Usar exclusivamente **lucide-react**. No mezclar con otras librerías.

```jsx
import { TrendingUp, Wallet, ChartBar, Settings } from 'lucide-react'

// Tamaño estándar:
<TrendingUp size={20} />   // inline, navegación
<TrendingUp size={24} />   // cards, secciones
<TrendingUp size={32} />   // heroes, onboarding

// Color: heredar del padre (currentColor)
// No hardcodear colores en iconos
```

Iconos por módulo (consistencia):

```
Dashboard:    LayoutDashboard
Patrimonio:   Wallet
Proyección:   TrendingUp
Análisis:     BarChart3
Diagnóstico:  Stethoscope
Ajustes:      Settings
Hipoteca:     Home
Inversión:    PieChart
Alerta:       AlertCircle
Éxito:        CheckCircle2
Info:         Info
```

---

## 7. Gráficos (Recharts)

### Paleta para gráficos

```javascript
const CHART_COLORS = {
  patrimonio: '#1D9E75', // línea principal siempre verde
  activos: '#378ADD', // azul para total activos
  deuda: '#E24B4A', // rojo para pasivos/deuda
  ingresos: '#1D9E75', // verde para ingresos
  gastosFijos: '#E24B4A', // rojo para gastos fijos
  ocio: '#EF9F27', // amber para gastos variables
  inversion: '#378ADD', // azul para inversión
  disponible: '#5DCAA5', // verde claro para disponible
};
```

### Estilos base de todos los gráficos

```jsx
<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
<XAxis
  tick={{ fill: '#8A9AAD', fontSize: 11 }}
  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
  tickLine={false}
/>
<YAxis
  tick={{ fill: '#8A9AAD', fontSize: 11 }}
  axisLine={false}
  tickLine={false}
  tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
/>
<Tooltip
  contentStyle={{
    background: '#1A2030',
    border: '0.5px solid rgba(255,255,255,0.14)',
    borderRadius: '12px',
    fontSize: '13px',
  }}
  labelStyle={{ color: '#C5D0DC' }}
/>
```

---

## 8. Estados y Feedback

### Loading

```jsx
// Skeleton: fondo pulsante, nunca spinners en cards de datos
<div className='animate-pulse bg-[#1E2530] rounded-xl h-[80px]' />
```

### Empty state

```jsx
// Siempre con icono, título y acción
<div className='flex flex-col items-center gap-3 py-12'>
  <Icon size={32} className='text-[#3D4F61]' />
  <p className='text-[#8A9AAD] text-sm text-center'>Texto explicativo breve</p>
  <button>Acción sugerida</button>
</div>
```

### Error / Alerta

```jsx
// Banner no bloqueante, siempre con X para cerrar
background: rgba(226, 75, 74, 0.10)
border: 0.5px solid rgba(226, 75, 74, 0.25)
color: #E24B4A
border-radius: 12px
padding: 12px 16px
```

### Éxito

```jsx
background: rgba(29, 158, 117, 0.10)
border: 0.5px solid rgba(29, 158, 117, 0.25)
color: #1D9E75
```

### Toast notifications

```jsx
// Aparecen arriba a la derecha, desaparecen en 3s
background: #1A2030
border: 0.5px solid rgba(255,255,255,0.14)
border-radius: 12px
padding: 12px 16px
font-size: 14px
// Con borde izquierdo de color semántico (verde/rojo/amber)
```

---

## 9. Animaciones

```css
/* Transición estándar para todos los elementos interactivos */
transition: all 150ms ease;

/* Hover en cards y botones */
transform: translateY(-1px);

/* Aparición de modales */
animation: slideUp 200ms ease;

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Nunca usar animaciones en datos financieros — confunde */
/* Nunca usar más de 300ms en transiciones de UI */
```

---

## 10. Modales

```jsx
/* Overlay */
background: rgba(0, 0, 0, 0.6)
backdrop-filter: blur(4px)

/* Contenedor del modal */
background: #161C24
border: 0.5px solid rgba(255,255,255,0.12)
border-radius: 20px 20px 0 0   /* en móvil: bottom sheet */
padding: 24px 24px 32px
max-height: 85vh
overflow-y: auto               /* scroll interno */

/* Pie del modal: siempre sticky, nunca se esconde */
position: sticky
bottom: 0
background: #161C24
padding-top: 16px
border-top: 0.5px solid rgba(255,255,255,0.06)

/* Botones en el pie: máximo 2 */
/* Primario: full width o a la derecha */
/* Secundario: "Cancelar" siempre a la izquierda */
```

---

## 11. Responsividad

La app es **mobile-first**. El 80% del uso será en móvil.

```
Móvil:    < 768px   → diseño principal, bottom nav
Tablet:   768-1024px → layout adaptado
Desktop:  > 1024px  → sidebar o top nav, más columnas
```

Breakpoints Tailwind usados:

```
sm:  640px
md:  768px
lg:  1024px
```

Reglas móvil:

- Botones CTA siempre full-width en móvil
- Tablas con scroll horizontal (nunca comprimir columnas)
- Cards en columna única
- Padding horizontal mínimo: 20px

---

## 12. Reglas de Coherencia Global

### Lo que SIEMPRE hay que hacer

- Leer este archivo antes de crear o modificar cualquier componente visual
- Usar los tokens de color definidos aquí, nunca hardcodear hex a mano
- Formatear todos los números con `formatMoney()` y `formatPercent()`
- Mantener sentence case en todos los textos de UI
- Añadir estado vacío en cualquier componente que muestre datos
- Añadir estado loading en cualquier componente que haga fetch

### Lo que NUNCA hay que hacer

- Mezclar colores de fondo claro con el sistema oscuro
- Usar más de 3 colores distintos en un mismo componente
- Mostrar datos sin formatear (números crudos, decimales sin redondear)
- Crear componentes nuevos que dupliquen los ya existentes en /components
- Añadir librerías de iconos distintas a lucide-react
- Usar gradients de fondo (solo permitidos en ilustraciones SVG del onboarding)
- Hardcodear strings de texto en JSX — todo pasa por i18n (es.json / en.json)

### Antes de crear un componente nuevo

1. Buscar si ya existe algo similar en `src/components/`
2. Revisar `src/lib/uiClasses.js` para clases reutilizables
3. Si no existe: crear en `src/components/` siguiendo este sistema
4. Nunca crear componentes específicos de módulo que puedan ser genéricos

---

## 13. Estructura de Archivos de UI

```
src/
  components/           ← componentes genéricos reutilizables
    KpiCard.jsx         ← métricas del dashboard
    AppModal.jsx        ← modal base con overlay y pie sticky
    ToastStack.jsx      ← notificaciones
    HelpTooltip.jsx     ← iconos de ayuda con tooltip
    MoneyField.jsx      ← input de cantidades en €
    PercentField.jsx    ← input de porcentajes

  lib/
    uiClasses.js        ← clases Tailwind reutilizables (ui.card, ui.heading...)
    formatters.js       ← formatMoney(), formatPercent(), formatDate()

  index.css             ← variables CSS globales y reset
```

Siempre usar `formatMoney()` de `src/utils/formatters.js`, nunca formatear a mano.
Siempre usar clases de `src/lib/uiClasses.js` donde existan.

---

## 14. Checklist antes de hacer PR/commit de UI

- [ ] ¿Los colores vienen de los tokens definidos en este archivo?
- [ ] ¿Los números se formatean con `formatMoney()` / `formatPercent()`?
- [ ] ¿El componente tiene estado vacío (empty state)?
- [ ] ¿El componente tiene estado de carga si hace fetch?
- [ ] ¿Los textos visibles al usuario están en `es.json`?
- [ ] ¿Se ve bien en móvil (375px)?
- [ ] ¿Los valores positivos van en verde (#1D9E75) y negativos en rojo (#E24B4A)?
- [ ] ¿Los bordes son 0.5px, no 1px?
- [ ] ¿El código de variables y claves JSON está en inglés?
