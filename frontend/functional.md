FINANCIA APP — Documento Funcional v1.0

Especificación técnica completa · React + Vite + Zustand + Supabase
Versión: 1.0 · Junio 2026


Índice

Visión General del Producto
Arquitectura Técnica
Modelo de Datos (Supabase)
Módulo: Onboarding
Módulo: Dashboard
Módulo: Balance Patrimonial
Módulo: Proyección Futura
Parámetros Financieros Configurables
Motor de Cálculos Financieros
API REST (Supabase)
Autenticación y Persistencia Local
Roadmap de Iteraciones


1. Visión General del Producto
FinanciaApp es una aplicación web de finanzas personales diseñada para que cualquier persona pueda tener una visión clara, precisa y proyectable de su patrimonio neto, cashflow y progresión financiera a lo largo del tiempo. El objetivo no es una simple hoja de cálculo, sino una herramienta inteligente que calcule, proyecte y alerte en base a datos reales del usuario.
1.1 Propuesta de Valor

Patrimonio neto en tiempo real con snapshots mensuales históricos
Cashflow detallado: ingresos netos vs. gastos fijos vs. gastos variables vs. ahorro/inversión
Proyección financiera a largo plazo con interés compuesto real (no solo nominal)
Parámetros financieros auditables y modificables con valores por defecto técnicamente correctos
Onboarding fluido con datos guardados en local antes de requerir registro
Backend en Supabase: sin servidor propio, capa gratuita suficiente para uso personal

1.2 Usuarios Objetivo
Profesionales de 25-45 años con ingresos estables que quieren optimizar su ahorro e inversión. No se requieren conocimientos financieros avanzados, pero la herramienta está diseñada para no simplificar en exceso los cálculos subyacentes.
1.3 Principios de Diseño

Datos primero: ningún número se muestra sin que el usuario pueda ver cómo se calcula
Modificabilidad: todos los parámetros relevantes son editables con valores por defecto razonados
Coherencia financiera: las fórmulas respetan estándares financieros (rentabilidad real vs. nominal, inflación, ecuación de Fisher)
Progressive disclosure: funciona sin cuenta, se enriquece al registrarse
Mobile-first pero usable en escritorio


2. Arquitectura Técnica
2.1 Stack Tecnológico
CapaTecnologíaJustificaciónFrontendReact 18 + ViteSPA rápida, ecosistema maduro, fácil deploy en Hostinger/VercelEstado GlobalZustandLigero, sin boilerplate, ideal para estado financiero mutableEstilosTailwind CSSUtilidades rápidas, consistencia visual, modo oscuro sencilloGráficosRechartsComponentes React nativos, buen soporte para series temporalesBackend / DBSupabase (PostgreSQL)Capa gratuita suficiente, auth integrada, API REST auto-generadaAlmacenamiento locallocalStorage + Zustand persistDatos funcionales antes de registroDeployHostinger (static) o VercelVite build → carpeta dist → subir al hostingVariables de entorno.env (VITE_SUPABASE_URL, ANON_KEY)Nunca hardcodear credenciales
2.2 Estructura de Carpetas del Proyecto
src/
  ├── components/         → Componentes UI reutilizables
  ├── modules/
  │   ├── onboarding/     → Stepper de configuración inicial
  │   ├── dashboard/      → Vista principal con métricas
  │   ├── balance/        → Activos, pasivos, snapshots
  │   └── projection/     → Proyección futura configurable
  ├── store/              → Zustand stores (user, assets, settings)
  ├── lib/
  │   ├── supabase.js     → Cliente Supabase
  │   ├── calculations.js → Motor de cálculos financieros (PURO, sin side effects)
  │   └── constants.js    → Parámetros por defecto
  ├── hooks/              → Custom hooks (useAssets, useProjection...)
  └── utils/              → Formatters, validators
2.3 Flujo de Persistencia

Fase 1 (sin cuenta): todos los datos viven en Zustand + localStorage. El usuario trabaja con normalidad.
Banner "guardar progreso" aparece tras 10 minutos de uso activo o al cerrar la pestaña (beforeunload).
Al registrarse: los datos de localStorage se migran automáticamente a Supabase (upsert silencioso).
Fase 2 (con cuenta): sincronización bidireccional. Supabase como fuente de verdad.
Los parámetros configurables se guardan en la tabla user_settings, nunca hardcodeados en el frontend.


3. Modelo de Datos (Supabase / PostgreSQL)
3.1 Tabla: profiles
sqlCREATE TABLE profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id),
  name           TEXT,
  age            INTEGER,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
3.2 Tabla: user_settings
Almacena todos los parámetros financieros configurables del usuario. Una fila por usuario.
sqlCREATE TABLE user_settings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID REFERENCES profiles(id) UNIQUE NOT NULL,

  -- INGRESOS
  monthly_net_salary          NUMERIC(12,2),        -- Salario neto mensual
  other_monthly_income        NUMERIC(12,2) DEFAULT 0,

  -- GASTOS FIJOS MENSUALES
  mortgage_rent               NUMERIC(10,2) DEFAULT 0,
  utilities                   NUMERIC(10,2) DEFAULT 0,   -- luz + agua + gas
  insurance                   NUMERIC(10,2) DEFAULT 0,
  subscriptions               NUMERIC(10,2) DEFAULT 0,
  other_fixed_expenses        NUMERIC(10,2) DEFAULT 0,

  -- PARÁMETROS DE INVERSIÓN (modificables, con defaults razonados)
  index_fund_nominal_return   NUMERIC(5,4) DEFAULT 0.0600,  -- 6.00%
  index_fund_real_return      NUMERIC(5,4) DEFAULT 0.0400,  -- 4.00%
  use_real_return             BOOLEAN DEFAULT TRUE,          -- TRUE = usar rentabilidad real
  expected_inflation          NUMERIC(5,4) DEFAULT 0.0200,  -- 2.00% (objetivo BCE)
  pension_plan_return         NUMERIC(5,4) DEFAULT 0.0350,  -- 3.50% nominal típico España
  savings_account_return      NUMERIC(5,4) DEFAULT 0.0250,  -- 2.50% cuentas remuneradas 2026
  annual_salary_increase      NUMERIC(5,4) DEFAULT 0.0150,  -- 1.50% incremento salarial

  -- PARÁMETROS DE PROYECCIÓN
  projection_years            INTEGER DEFAULT 25,
  monthly_investment_amount   NUMERIC(10,2) DEFAULT 0,      -- 0 = usar cashflow libre automático

  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);
3.3 Tabla: assets (Activos)
sqlCREATE TABLE assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) NOT NULL,
  name        TEXT NOT NULL,    -- "Santander Cuenta Corriente"
  -- Categorías: bank | investment | real_estate | cash | pension | other
  category    TEXT NOT NULL,
  provider    TEXT,             -- "Indexa Capital", "Myinvestor", "Trade Republic"...
  notes       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
Categorías de activos y su tratamiento:
CategoríaClaveRentabilidad en proyecciónCuenta corriente / débitobank0% (dinero sin rentabilidad)Cuenta remunerada / depósitobanksavings_account_return (default 2.5%)Fondos indexadosinvestmentindex_fund_real_return o nominal según configPlan de pensionespensionpension_plan_return (default 3.5%)Dinero en efectivocash0%Vivienda habitualreal_estateNo se proyecta como generador de renta (ilíquido)Inmueble de inversiónreal_estateConfigurable: rentabilidad bruta alquiler - gastosOtrosotherConfigurable individualmente
3.4 Tabla: liabilities (Pasivos)
sqlCREATE TABLE liabilities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES profiles(id) NOT NULL,
  name             TEXT NOT NULL,
  -- Categorías: mortgage | personal_loan | credit_card | family_debt | other
  category         TEXT NOT NULL,
  monthly_payment  NUMERIC(10,2) DEFAULT 0,   -- cuota mensual (para cashflow)
  interest_rate    NUMERIC(5,4),               -- tipo de interés anual
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
3.5 Tabla: monthly_snapshots
Cada snapshot cierra el mes y guarda el valor exacto de cada activo y pasivo. Es la fuente de la tabla histórica y de los gráficos de evolución.
sqlCREATE TABLE monthly_snapshots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) NOT NULL,
  asset_id     UUID REFERENCES assets(id),       -- NULL si es pasivo
  liability_id UUID REFERENCES liabilities(id),  -- NULL si es activo
  snapshot_date DATE NOT NULL,                   -- siempre último día del mes
  value        NUMERIC(14,2) NOT NULL,            -- positivo activos, NEGATIVO pasivos
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset_id, snapshot_date),
  UNIQUE(liability_id, snapshot_date)
);

Nota importante: Los valores de pasivos en monthly_snapshots deben almacenarse como negativos. Esto permite calcular el patrimonio neto con una simple suma: PN = Σ(todos los values del mes).


4. Módulo: Onboarding (Stepper)
El onboarding se muestra únicamente la primera vez que el usuario accede (localStorage key: onboarding_completed = false). Consta de 5 pasos. Los datos se guardan en Zustand en tiempo real conforme el usuario avanza.
4.1 Pasos del Stepper
PasoTítuloCamposNotas UX1BienvenidaNombre, edadPantalla acogedora. CTA: "Empezar"2Tus ingresosSalario neto mensual, otros ingresos mensuales netosSiempre en NETO. Tooltip explicando diferencia bruto/neto3Gastos fijosHipoteca/alquiler, suministros, seguros, suscripciones, otrosSubtotal calculado en tiempo real mientras escribe4Tu inversiónAportación mensual a inversión, productos que usaMuestra cashflow resultante: ingresos - gastos - inversión = libre5ResumenPatrimonio inicial, cashflow, tasa de ahorro calculadaBotón: "Empezar". Opción de registrarse ya o más tarde
4.2 Lógica del Banner "Guardar Progreso"

Se activa a los 10 minutos de uso activo (timer con Zustand) o en el evento window.beforeunload.
Muestra un modal no bloqueante con dos opciones: "Registrarme" y "Continuar sin cuenta".
Si elige registrarse, el formulario de auth es mínimo: email + contraseña.
Tras registro, se llama a migrateLocalToSupabase() que hace upsert de todos los datos locales.
El banner no vuelve a aparecer si el usuario lo descarta (localStorage key: banner_dismissed).


5. Módulo: Dashboard
5.1 KPIs Principales
KPICálculoFormato / AlertaPatrimonio NetoΣ(activos) + Σ(pasivos) — pasivos son negativos€ con separador de miles. Verde si sube, rojo si bajaTotal ActivosΣ(snapshots de activos del mes actual)€, desglose por categoría en tooltipTotal PasivosΣ(snapshots de pasivos, valor negativo)€ en rojoTasa de Ahorro(ahorro_mensual / ingresos_netos_totales) × 100% · ≥20% verde · 10-20% amarillo · <10% rojoCashflow Libreingresos - gastos_fijos - aportación_inversión€/mes. Si negativo → alerta visualVariación Mensual`(PN_actual - PN_anterior) /PN_anterior
5.2 Gráficos

Línea: Evolución del patrimonio neto (eje Y: €, eje X: meses). Dos series: "Patrimonio Neto" y "Total Activos". Últimos 12 meses disponibles.
Barra apilada horizontal normalizada: cashflow — ingresos vs. gastos fijos vs. gastos variables vs. inversión vs. libre.
Donut: Distribución de activos por categoría (Bancos / Inversiones / Inmuebles / Pensiones / Efectivo / Otros).
Mini-tabla: Top 3 activos y Top 3 pasivos por peso en el patrimonio.

5.3 Alertas Inteligentes
⚠️  ALERTA 1: Cashflow libre negativo → "Tus gastos superan tus ingresos este mes"
⚠️  ALERTA 2: Tasa de ahorro < 10% → "Estás ahorrando menos del 10% de tu salario"
⚠️  ALERTA 3: Deuda en tarjeta > 0 → "Tienes deuda en tarjeta. Considera amortizarla primero"
⚠️  ALERTA 4: Patrimonio neto negativo → "Tu deuda supera tus activos. Revisa tus pasivos"

6. Módulo: Balance Patrimonial
6.1 Gestión de Activos
El usuario puede añadir, editar y desactivar activos. Cada activo tiene una categoría que determina cómo se agrupa en los resúmenes y qué rentabilidad estimada se le aplica en las proyecciones.
Campos del formulario de activo:

Nombre (texto libre)
Categoría (select con opciones predefinidas)
Proveedor (texto libre: "Indexa Capital", "Myinvestor", "Revolut"...)
Notas (opcional)

6.2 Gestión de Pasivos
Cada pasivo tiene:

Nombre y categoría
Cuota mensual → se suma a los gastos fijos para el cálculo de cashflow
Tipo de interés → para cálculos de amortización futura (iteración 3)
Valor actual de la deuda → se introduce en el snapshot mensual como valor negativo

6.3 Cierre Mensual (Snapshot)

El "cierre mensual" es la acción por la que el usuario registra el valor actual de cada activo y pasivo. No es automático: el usuario decide cuándo cerrar el mes (idealmente el último día de cada mes).

UX del cierre mensual:

Botón "Cerrar mes" en la cabecera del módulo.
Al pulsarlo, se abre un formulario con todos los activos y pasivos listados.
Los valores del mes anterior vienen pre-rellenados — el usuario solo modifica los que hayan cambiado.
Al confirmar, se insertan los registros en monthly_snapshots.

6.4 Tabla Resumen Histórica
La tabla muestra columnas por mes (máximo 12 meses visibles, scroll horizontal) y filas por activo/pasivo.
Filas de resumen calculadas automáticamente:

Total por categoría: Bancos, Inversiones, Inmuebles, Pensiones, Efectivo, Otros
Total Activos, Total Pasivos, Patrimonio Neto
Variación mes a mes en € y en %


7. Módulo: Proyección Futura
7.1 Inputs del Módulo
ParámetroDefaultRangoDescripciónAños a proyectar255–50Horizonte temporalAportación mensualauto (cashflow libre)manualPor defecto = cashflow libre del dashboardTipo de rentabilidadRealReal / NominalSelector con explicación en tooltipRentabilidad fondos (real)4.00%0–15%Después de inflación. Default: media histórica MSCI World realRentabilidad fondos (nominal)6.00%0–18%Sin descontar inflaciónInflación esperada2.00%0–8%Objetivo BCE a largo plazoRentabilidad plan de pensiones3.50%0–10%Estimación conservadora para PP en EspañaRentabilidad cuenta remunerada2.50%0–6%Cuentas remuneradas típicas España junio 2026Incremento salarial anual1.50%0–10%Estimación conservadora: IPC objetivo BCE% salario a inversiónauto0–100%Si activo, la aportación crece con el salario
7.2 Escenarios Predefinidos
EscenarioRent. fondos (real)InflaciónInc. salarialDescripciónConservador3.00%2.50%1.00%Mercados planos, inflación alta, sin ascensosModerado4.00%2.00%1.50%Escenario base realista para España 2026+Optimista6.00%1.50%2.50%Buen ciclo bursátil, carrera en ascensoPersonalizadolibrelibrelibreEl usuario configura cada parámetro
7.3 Outputs de la Proyección

Gráfico de área: patrimonio proyectado vs. solo aportaciones (sin rentabilidad) → visualiza el poder del interés compuesto.
Interés compuesto generado: patrimonio_final_proyectado − suma_de_aportaciones_totales
Hitos automáticos marcados en el gráfico: ×2 patrimonio actual, ×5, ×10.
Tabla anual detallada: año | patrimonio inicio | aportación anual | rentabilidad generada | patrimonio final.
Indicador FIRE (Financial Independence Retire Early): año estimado en que los rendimientos anuales igualan los gastos anuales.


8. Parámetros Financieros Configurables
8.1 Rentabilidad Nominal vs. Real — Concepto Fundamental

CRÍTICO para el equipo de desarrollo: esta distinción debe estar clara en la UI y en todos los cálculos.

Rentabilidad NOMINAL: lo que el fondo reporta oficialmente, sin descontar inflación.
Rentabilidad REAL:    poder adquisitivo real ganado.

Fórmula de Fisher:
  r_real = (1 + r_nominal) / (1 + inflación) - 1

Ejemplo con los defaults de la app:
  Nominal:   6.00%
  Inflación: 2.00%
  Real:      (1.06 / 1.02) - 1 = 3.92% ≈ 4.00%
¿Cuándo usar cada una?

Rentabilidad real → proyecciones a largo plazo donde los gastos futuros se expresan en euros de HOY (poder adquisitivo constante). Es el modo por defecto y el correcto.
Rentabilidad nominal → útil para comparar con otras inversiones o productos financieros que reportan en nominal.

La UI debe comunicar esto con un banner informativo cuando el usuario cambia entre modos.
8.2 Justificación de los Valores por Defecto
ParámetroDefaultJustificación técnicaRentabilidad nominal fondos indexados6.00%Media histórica MSCI World en EUR ~7% anual últimos 50 años. Se usa 6% descontando costes de producto (~0.5-1% TER típico en Indexa/Myinvestor)Rentabilidad real fondos indexados4.00%Fórmula de Fisher: (1.06/1.02)-1 = 3.92%, redondeado a 4%. Coherente con estudios de Vanguard y Research Affiliates para carteras globales diversificadasInflación esperada2.00%Objetivo oficial del BCE. Estándar para planificación financiera a largo plazo en la EurozonaRentabilidad plan de pensiones3.50%Conservadora para PP renta variable/mixto en España. Los PP tienen mayor fiscalidad en el rescate, por lo que un retorno esperado algo menor que fondos libres está justificadoRentabilidad cuenta remunerada2.50%Oferta media en España junio 2026 (Openbank, Revolut, Trade Republic, MyInvestor). Revisar cada 6 meses según política BCEIncremento salarial anual1.50%IPC objetivo (2%) menos un pequeño descuento. Conservador como base de planificación
8.3 Pantalla de Configuración de Parámetros
Accesible desde: Perfil > Parámetros financieros
Cada parámetro muestra:

Slider + campo numérico editable simultáneamente
Tooltip con la explicación y justificación del valor por defecto
Botón "Restaurar default" individual
Botón "Restaurar todos los defaults" al pie de la pantalla
La proyección se recalcula en tiempo real al cambiar cualquier parámetro (debounce 300ms)
Aviso contextual: "Estás usando rentabilidad real. Los resultados se expresan en euros de hoy (poder adquisitivo constante)."


9. Motor de Cálculos Financieros

Todas las fórmulas residen en src/lib/calculations.js como funciones puras (sin side effects, sin acceso a estado global). Esto facilita el testing unitario y la depuración.

9.1 Fórmulas del Dashboard
ConceptoFórmulaNotasPatrimonio NetoPN = Σ(activos_mes) + Σ(pasivos_mes)Pasivos son negativos. PN puede ser negativoVariación PN((PN_actual - PN_anterior) / |PN_anterior|) × 100Usar valor absoluto del denominadorTasa de Ahorro(ahorro_mensual / ingresos_netos_totales) × 100ahorro = ingresos - gastos_fijos - gastos_varCashflow LibreCF = ingresos_netos - gastos_fijos - inversión_mensualPuede ser negativo (alerta)
9.2 Fórmulas de Proyección
ConceptoFórmulaNotasValor Futuro (aportaciones)FV = C × [((1+r)^n - 1) / r]C=aportación periódica, r=tasa por periodo, n=periodosValor Futuro (capital inicial)FV_0 = PV × (1+r)^nPV=patrimonio actual, r=tasa anual, n=añosFV TotalFV_total = FV_0 + FV_aportacionesSuma capital actual proyectado + aportacionesRentabilidad real (Fisher)r_real = (1 + r_nom) / (1 + inflación) - 1Aplicar siempre cuando use_real_return = TRUETasa mensual desde anualr_mes = (1 + r_anual)^(1/12) - 1Conversión correcta. NUNCA dividir por 12Interés compuesto generadoIC = FV_total - (patrimonio_inicial + aportaciones_totales)Lo que genera la inversión por sí solaFIRE yearAño en que FV × r_real >= gastos_anualesgastos_anuales = (gastos_fijos + variables) × 12Salario con incrementoS_n = S_0 × (1 + inc_salarial)^nActualiza aportación si % del salario está activo

⚠️ CRÍTICO — Tasa mensual:
CORRECTO:   r_mes = (1 + 0.06)^(1/12) - 1 = 0.004868 (0.4868%)
INCORRECTO: r_mes = 0.06 / 12 = 0.005 (0.5%)
La diferencia acumulada en 25 años puede ser de miles de euros.

9.3 Código de Referencia — src/lib/calculations.js
javascript// src/lib/calculations.js — FUNCIONES PURAS, sin imports de estado global

/**
 * Convierte rentabilidad nominal a real usando la ecuación de Fisher
 * @param {number} nominalRate - Tasa nominal anual (0.06 = 6%)
 * @param {number} inflationRate - Inflación anual (0.02 = 2%)
 * @returns {number} Tasa real anual
 */
export const nominalToReal = (nominalRate, inflationRate) =>
  (1 + nominalRate) / (1 + inflationRate) - 1;

/**
 * Tasa mensual desde anual — método correcto (raíz doceava, NO dividir por 12)
 * @param {number} annualRate - Tasa anual efectiva
 * @returns {number} Tasa mensual efectiva
 */
export const annualToMonthly = (annualRate) =>
  Math.pow(1 + annualRate, 1 / 12) - 1;

/**
 * Valor Futuro de aportaciones periódicas mensuales (anuidades ordinarias)
 * @param {number} monthlyContrib - Aportación mensual en €
 * @param {number} annualRate     - Tasa anual efectiva (ya convertida: real o nominal)
 * @param {number} years          - Horizonte en años
 * @returns {number} Valor futuro en €
 */
export const futureValueContributions = (monthlyContrib, annualRate, years) => {
  const r = annualToMonthly(annualRate);
  const n = years * 12;
  if (r === 0) return monthlyContrib * n;
  return monthlyContrib * ((Math.pow(1 + r, n) - 1) / r);
};

/**
 * Valor Futuro de un capital inicial (sin aportaciones adicionales)
 * @param {number} presentValue - Capital inicial en €
 * @param {number} annualRate   - Tasa anual efectiva
 * @param {number} years        - Horizonte en años
 * @returns {number} Valor futuro en €
 */
export const futureValueLumpSum = (presentValue, annualRate, years) =>
  presentValue * Math.pow(1 + annualRate, years);

/**
 * Proyección año a año completa — devuelve tabla con todos los datos intermedios
 *
 * @param {object} params
 * @param {number} params.initialPatrimony          - Patrimonio neto actual en €
 * @param {number} params.monthlyContrib            - Aportación mensual en €
 * @param {number} params.annualRate                - Tasa ya convertida (real o nominal según config)
 * @param {number} params.years                     - Años a proyectar
 * @param {number} params.annualSalaryIncrease       - Incremento salarial anual (0.015 = 1.5%)
 * @param {boolean} params.contribGrowsWithSalary    - Si true, la aportación crece con el salario
 * @returns {Array<{year, patrimonioInicio, aportacionAnual, rentabilidadGenerada, patrimonioFin, totalAportaciones, interesCompuestoTotal}>}
 */
export const buildProjectionTable = ({
  initialPatrimony,
  monthlyContrib,
  annualRate,
  years,
  annualSalaryIncrease = 0.015,
  contribGrowsWithSalary = false,
}) => {
  const table = [];
  let patrimonioInicio = initialPatrimony;
  let contrib = monthlyContrib;
  let totalAportaciones = 0;

  for (let year = 1; year <= years; year++) {
    if (contribGrowsWithSalary && year > 1) {
      contrib *= (1 + annualSalaryIncrease);
    }

    const r = annualToMonthly(annualRate);
    const fvCapital = patrimonioInicio * Math.pow(1 + annualRate, 1);
    const fvContrib = r === 0
      ? contrib * 12
      : contrib * ((Math.pow(1 + r, 12) - 1) / r);

    const patrimonioFin = fvCapital + fvContrib;
    const aportacionAnual = contrib * 12;
    totalAportaciones += aportacionAnual;
    const interesGenerado = patrimonioFin - initialPatrimony - totalAportaciones;

    table.push({
      year,
      patrimonioInicio:       Math.round(patrimonioInicio),
      aportacionAnual:        Math.round(aportacionAnual),
      rentabilidadGenerada:   Math.round(patrimonioFin - patrimonioInicio - aportacionAnual),
      patrimonioFin:          Math.round(patrimonioFin),
      totalAportaciones:      Math.round(totalAportaciones),
      interesCompuestoTotal:  Math.round(interesGenerado),
    });

    patrimonioInicio = patrimonioFin;
  }

  return table;
};

/**
 * Calcula el año FIRE: cuando los rendimientos anuales proyectados
 * cubren los gastos anuales del usuario
 *
 * @param {Array}  projectionTable  - Output de buildProjectionTable()
 * @param {number} annualExpenses   - Gastos anuales en € (gastos_fijos + variables) × 12
 * @param {number} annualRate       - Tasa de rentabilidad anual usada en la proyección
 * @returns {number|null} Año FIRE o null si no se alcanza en el horizonte
 */
export const calcFIREYear = (projectionTable, annualExpenses, annualRate) => {
  return projectionTable.find(
    row => row.patrimonioFin * annualRate >= annualExpenses
  )?.year ?? null;
};

/**
 * Calcula el patrimonio neto actual desde un array de snapshots
 * @param {Array<{value: number}>} snapshots - Snapshots del mes actual
 * @returns {number} Patrimonio neto (activos positivos + pasivos negativos)
 */
export const calcNetWorth = (snapshots) =>
  snapshots.reduce((sum, s) => sum + s.value, 0);

/**
 * Tasa de ahorro mensual
 * @param {number} totalIncome    - Ingresos netos totales mensuales
 * @param {number} fixedExpenses  - Gastos fijos mensuales
 * @param {number} varExpenses    - Gastos variables mensuales (estimados)
 * @returns {number} Tasa de ahorro entre 0 y 1
 */
export const calcSavingsRate = (totalIncome, fixedExpenses, varExpenses = 0) => {
  if (totalIncome <= 0) return 0;
  const savings = totalIncome - fixedExpenses - varExpenses;
  return Math.max(0, savings / totalIncome);
};

/**
 * Cashflow libre mensual
 * @param {number} totalIncome         - Ingresos netos totales
 * @param {number} fixedExpenses       - Gastos fijos mensuales
 * @param {number} monthlyInvestment   - Aportación mensual a inversión
 * @returns {number} Cashflow libre (puede ser negativo)
 */
export const calcFreeCashflow = (totalIncome, fixedExpenses, monthlyInvestment) =>
  totalIncome - fixedExpenses - monthlyInvestment;
9.4 Constantes por Defecto — src/lib/constants.js
javascript// src/lib/constants.js

export const DEFAULT_SETTINGS = {
  // Rentabilidad inversiones
  indexFundNominalReturn:  0.0600,  // 6.00% — MSCI World media histórica en EUR ajustada por costes
  indexFundRealReturn:     0.0400,  // 4.00% — Fisher: (1.06/1.02)-1 = 3.92% ≈ 4%
  useRealReturn:           true,    // Proyecciones en poder adquisitivo constante por defecto
  expectedInflation:       0.0200,  // 2.00% — Objetivo oficial BCE
  pensionPlanReturn:       0.0350,  // 3.50% — PP conservador España (nominal)
  savingsAccountReturn:    0.0250,  // 2.50% — Cuentas remuneradas España junio 2026

  // Proyección
  projectionYears:         25,
  annualSalaryIncrease:    0.0150,  // 1.50% — IPC objetivo menos descuento

  // Benchmarks de tasa de ahorro para alertas de color en dashboard
  SAVINGS_RATE_GREEN:      0.20,    // ≥20% = verde
  SAVINGS_RATE_YELLOW:     0.10,    // 10-20% = amarillo
                                    // <10% = rojo
};

export const ASSET_CATEGORIES = [
  { value: 'bank',         label: 'Banco / Cuenta corriente' },
  { value: 'investment',   label: 'Fondos indexados / ETF' },
  { value: 'pension',      label: 'Plan de pensiones' },
  { value: 'cash',         label: 'Efectivo' },
  { value: 'real_estate',  label: 'Inmueble' },
  { value: 'other',        label: 'Otro activo' },
];

export const LIABILITY_CATEGORIES = [
  { value: 'mortgage',      label: 'Hipoteca' },
  { value: 'personal_loan', label: 'Préstamo personal' },
  { value: 'credit_card',   label: 'Tarjeta de crédito' },
  { value: 'family_debt',   label: 'Deuda familiar' },
  { value: 'other',         label: 'Otra deuda' },
];

export const PROJECTION_SCENARIOS = {
  conservative: {
    label:               'Conservador',
    indexFundRealReturn: 0.0300,
    expectedInflation:   0.0250,
    annualSalaryIncrease:0.0100,
  },
  moderate: {
    label:               'Moderado',
    indexFundRealReturn: 0.0400,
    expectedInflation:   0.0200,
    annualSalaryIncrease:0.0150,
  },
  optimistic: {
    label:               'Optimista',
    indexFundRealReturn: 0.0600,
    expectedInflation:   0.0150,
    annualSalaryIncrease:0.0250,
  },
};

10. API REST (Supabase)
Supabase auto-genera una API REST para cada tabla con Row Level Security (RLS) activado. El cliente en React usa el SDK @supabase/supabase-js. Toda la lógica de negocio vive en el frontend (calculations.js) o en Edge Functions para operaciones críticas.
10.1 Endpoints Principales
EndpointMétodoAuthDescripción/rest/v1/user_settingsGET / PATCHJWTObtener o actualizar parámetros financieros/rest/v1/assetsGET / POST / PATCH / DELETEJWTCRUD de activos/rest/v1/liabilitiesGET / POST / PATCH / DELETEJWTCRUD de pasivos/rest/v1/monthly_snapshotsGET / POSTJWTObtener histórico o insertar cierre mensual/rest/v1/profilesGET / PATCHJWTPerfil del usuario/auth/v1/signupPOSTanon keyRegistro con email + contraseña/auth/v1/tokenPOSTanon keyLogin, obtener JWT/functions/v1/migrate-localPOSTJWTEdge Function: migrar localStorage → Supabase
10.2 Seguridad — Row Level Security (RLS)
sql-- Activar RLS en todas las tablas
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;

-- Política estándar: el usuario solo puede acceder a sus propios datos
CREATE POLICY "user_own_data" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- (Repetir para assets, liabilities, monthly_snapshots)

⚠️ Nunca usar la service_role key en el frontend. Solo en Edge Functions o scripts de migración de servidor.

10.3 Cliente Supabase — src/lib/supabase.js
javascriptimport { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
10.4 Migración localStorage → Supabase
javascript// src/lib/migrateLocalToSupabase.js
import { supabase } from './supabase';
import { useAppStore } from '../store/appStore';

export const migrateLocalToSupabase = async (userId) => {
  const { assets, liabilities, snapshots, settings } = useAppStore.getState();

  try {
    // 1. Upsert settings
    if (settings) {
      await supabase
        .from('user_settings')
        .upsert({ ...settings, user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });
    }

    // 2. Upsert assets
    if (assets.length) {
      await supabase.from('assets').upsert(
        assets.map(a => ({ ...a, user_id: userId })),
        { ignoreDuplicates: true }
      );
    }

    // 3. Upsert liabilities
    if (liabilities.length) {
      await supabase.from('liabilities').upsert(
        liabilities.map(l => ({ ...l, user_id: userId })),
        { ignoreDuplicates: true }
      );
    }

    // 4. Upsert snapshots
    if (snapshots.length) {
      await supabase.from('monthly_snapshots').upsert(
        snapshots.map(s => ({ ...s, user_id: userId })),
        { ignoreDuplicates: true }
      );
    }

    // 5. Limpiar localStorage tras migración exitosa
    localStorage.removeItem('financia_app_data');
    return { success: true };

  } catch (error) {
    console.error('Migration failed:', error);
    // Los datos locales se conservan para reintentarlo en el próximo login
    return { success: false, error };
  }
};

11. Autenticación y Persistencia Local
11.1 Estados de Sesión
EstadoDescripciónComportamientoguest_no_dataPrimera visita, sin datosMuestra onboarding stepperguest_with_dataCompletó onboarding, sin cuentaApp funcional con localStorage. Banner de guardado activoauthenticatedRegistrado y logueadoDatos en Supabase. Banner desaparece. Sincronización activareturning_guestTiene localStorage de sesión anteriorCarga datos locales directamente, sin onboarding
11.2 Zustand Store Principal
javascript// src/store/appStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      sessionStatus: 'guest_no_data', // guest_no_data | guest_with_data | authenticated | returning_guest

      // Onboarding
      onboardingCompleted: false,
      bannerDismissed: false,
      activeMinutes: 0,

      // Datos financieros
      settings: null,       // user_settings
      assets: [],           // assets[]
      liabilities: [],      // liabilities[]
      snapshots: [],        // monthly_snapshots[]

      // Actions
      setUser: (user) => set({ user, sessionStatus: 'authenticated' }),
      setSettings: (settings) => set({ settings }),
      addAsset: (asset) => set(s => ({ assets: [...s.assets, asset] })),
      addLiability: (liability) => set(s => ({ liabilities: [...s.liabilities, liability] })),
      addSnapshot: (snapshot) => set(s => ({ snapshots: [...s.snapshots, snapshot] })),
      completeOnboarding: () => set({ onboardingCompleted: true, sessionStatus: 'guest_with_data' }),
      dismissBanner: () => set({ bannerDismissed: true }),
      incrementActiveMinutes: () => set(s => ({ activeMinutes: s.activeMinutes + 1 })),
    }),
    {
      name: 'financia_app_data',
      partialize: (state) => ({
        onboardingCompleted: state.onboardingCompleted,
        bannerDismissed: state.bannerDismissed,
        settings: state.settings,
        assets: state.assets,
        liabilities: state.liabilities,
        snapshots: state.snapshots,
      }),
    }
  )
);

12. Roadmap de Iteraciones
Iteración 1 — MVP (4-6 semanas)

 Onboarding stepper (5 pasos) + persistencia localStorage
 Dashboard con 6 KPIs + gráfico evolución PN + barra cashflow
 Balance patrimonial: CRUD activos y pasivos + cierre mensual + tabla histórica
 Proyección futura: motor de cálculo + gráfico + tabla anual
 Parámetros configurables con valores por defecto justificados
 Auth básica Supabase (registro + login) + migración datos locales
 Banner "guardar progreso"

Iteración 2 — Enriquecimiento (3-4 semanas)

 Indicador FIRE con hito visual en gráfico de proyección
 Alertas inteligentes en dashboard
 Donut chart distribución de activos
 Modo oscuro
 PWA para acceso móvil sin instalación
 Exportar balance a PDF / CSV

Iteración 3 — Potencia (4-6 semanas)

 Seguimiento de inversiones: rentabilidades reales vs. estimadas
 Calculadora de amortización anticipada de hipoteca
 Módulo de metas financieras (fondo emergencia, compra, viaje...)
 Notificación mensual para cerrar el mes

Iteración 4 — Avanzado

 Importación extractos bancarios CSV/OFX
 Análisis de gastos por categoría (gráficos Sankey)
 Multi-divisa básico (USD, GBP con tipo de cambio)
 Modo familia: varios perfiles bajo una cuenta


Notas para Cursor AI

Cómo usar este documento eficientemente:


Empieza siempre pasando la Sección 3 (modelo de datos) y la Sección 9 (motor de cálculos) como contexto base antes de construir cualquier módulo.
Por módulo: añade la sección correspondiente (4 para onboarding, 5 para dashboard, etc.) al contexto cuando vayas a construir ese módulo.
El archivo calculations.js de la sección 9.3 debe crearse primero y no debe importar nada de fuera de lib/. Es la fuente de verdad matemática de toda la app.
Los defaults de constants.js (sección 9.4) son los valores que poblarán user_settings cuando un usuario nuevo complete el onboarding.
RLS en Supabase debe activarse antes de hacer cualquier prueba con datos reales (sección 10.2).