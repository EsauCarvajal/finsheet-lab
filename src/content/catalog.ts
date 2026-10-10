import {
  bi,
  type Cells,
  type ChallengeDefinition,
  type Difficulty,
  type Localized,
  type ModuleDefinition,
  type Target,
} from '../types.ts';

export const modules: ModuleDefinition[] = [
  {
    id: 'foundations',
    title: bi('Fundamentos financieros', 'Financial foundations'),
    description: bi(
      'Convierte datos en tus primeras decisiones.',
      'Turn data into your first decisions.',
    ),
    icon: 'calculator',
    color: '#137c59',
    functions: ['SUM', 'AVERAGE', 'ROUND'],
  },
  {
    id: 'logic',
    title: bi('Lógica y controles', 'Logic & controls'),
    description: bi('Construye modelos que sepan qué hacer.', 'Build models that know what to do.'),
    icon: 'git',
    color: '#7260b8',
    functions: ['IF', 'AND', 'OR', 'IFERROR'],
  },
  {
    id: 'aggregation',
    title: bi('Análisis por categorías', 'Category analysis'),
    description: bi('Encuentra respuestas dentro de los datos.', 'Find answers within the data.'),
    icon: 'chart',
    color: '#3786af',
    functions: ['SUMIF', 'SUMIFS', 'COUNTIF', 'COUNTIFS'],
  },
  {
    id: 'lookups',
    title: bi('Búsquedas y cruces', 'Lookups & matching'),
    description: bi('Conecta información con precisión.', 'Connect information with precision.'),
    icon: 'search',
    color: '#c18735',
    functions: ['XLOOKUP', 'VLOOKUP', 'INDEX', 'MATCH'],
  },
  {
    id: 'data',
    title: bi('Texto y fechas', 'Text & dates'),
    description: bi(
      'Prepara datos confiables para analizar.',
      'Prepare trustworthy data for analysis.',
    ),
    icon: 'calendar',
    color: '#bd6579',
    functions: ['TRIM', 'LEFT', 'RIGHT', 'DATE', 'EOMONTH'],
  },
  {
    id: 'finance',
    title: bi('Decisiones de inversión', 'Investment decisions'),
    description: bi(
      'Entiende el valor del dinero en el tiempo.',
      'Understand the time value of money.',
    ),
    icon: 'trend',
    color: '#537ab8',
    functions: ['PMT', 'PV', 'NPV', 'IRR'],
  },
];

function sheet(rows: (string | number | null)[][]): Cells {
  return Object.fromEntries(
    rows.flatMap((row, r) =>
      row.flatMap((v, c) =>
        v === null ? [] : [[`${String.fromCharCode(65 + c)}${r + 1}`, String(v)]],
      ),
    ),
  );
}
const target = (
  cell: string,
  formula: string,
  es: string,
  en: string,
  format: Target['format'] = 'number',
  tolerance = 1e-7,
): Target => ({ cell, formula, label: bi(es, en), format, tolerance });
function create(
  id: string,
  module: string,
  difficulty: Difficulty,
  title: Localized,
  lesson: Localized,
  task: Localized,
  rows: (string | number | null)[][],
  targets: Target[],
  hints: [Localized, Localized],
  explanation: Localized,
  variants: Cells[],
  interpretation?: ChallengeDefinition['interpretation'],
): ChallengeDefinition {
  return {
    id,
    version: 1,
    module,
    difficulty,
    title,
    lesson,
    task,
    seed: sheet(rows),
    targets,
    hints,
    explanation,
    variants,
    interpretation,
    prerequisiteIds: [],
    minutes:
      difficulty === 'case' ? 20 : difficulty === 'hard' ? 10 : difficulty === 'medium' ? 7 : 4,
  };
}
const sumLesson = bi(
  'SUMA agrega un rango de celdas. Una referencia como B2:B5 incluye ambos extremos. Los importes de estos ejercicios están expresados en unidades monetarias (UM).',
  'SUM adds a range of cells. A reference such as B2:B5 includes both endpoints. Amounts in these exercises are expressed in currency units (CU).',
);
const logicLesson = bi(
  'SI evalúa una condición y devuelve un resultado para verdadero y otro para falso. Los códigos OK, REVIEW y MISSING permanecen iguales en ambos idiomas.',
  'IF evaluates a condition and returns one result for true and another for false. The codes OK, REVIEW and MISSING stay the same in both languages.',
);
const conditionalLesson = bi(
  'Las agregaciones condicionales seleccionan registros que cumplen criterios. Los rangos de criterios y de importes deben tener el mismo tamaño.',
  'Conditional aggregations select records matching criteria. Criteria and amount ranges must have the same size.',
);
const lookupLesson = bi(
  'Una búsqueda relaciona un identificador con un dato del catálogo. Usa coincidencia exacta cuando trabajes con códigos financieros.',
  'A lookup connects an identifier to a catalog value. Use exact matching when working with financial codes.',
);
const timeLesson = bi(
  'Excel representa fechas mediante números de serie. FECHA construye una fecha y FIN.MES devuelve el último día del mes indicado.',
  'Excel represents dates as serial numbers. DATE constructs a date and EOMONTH returns the last day of the specified month.',
);
const financeLesson = bi(
  'Relaciona la tasa con la periodicidad de los flujos. Los pagos y las inversiones representan salidas de caja y llevan signo negativo.',
  'Match the interest rate to the cash-flow period. Payments and investments represent cash outflows and use a negative sign.',
);

export const challenges: ChallengeDefinition[] = [
  create(
    'foundation-01',
    'foundations',
    'easy',
    bi('El cierre de ventas', 'The sales close'),
    sumLesson,
    bi(
      'Suma las ventas de B2:B5 y escribe la fórmula del total en B7.',
      'Add sales in B2:B5 and enter the total formula in B7.',
    ),
    [
      ['Month', 'Revenue'],
      ['JAN', 12500],
      ['FEB', 15800],
      ['MAR', 14200],
      ['APR', 17500],
      [],
      ['Total', null],
    ],
    [target('B7', '=SUM(B2:B5)', 'Ventas totales', 'Total revenue', 'money')],
    [
      bi('Trabaja con el rango completo B2:B5.', 'Work with the complete B2:B5 range.'),
      bi('Usa SUMA en español o SUM en inglés.', 'Use SUM in English or SUMA in Spanish.'),
    ],
    bi(
      'El total es 60.000 UM. Consolidar ventas es el primer paso para comparar la ejecución contra el presupuesto.',
      'The total is 60,000 CU. Consolidating sales is the first step toward comparing actuals with the budget.',
    ),
    [
      { B2: '8300', B4: '19100' },
      { B3: '21000', B5: '9200' },
    ],
  ),
  create(
    'foundation-02',
    'foundations',
    'easy',
    bi('¿Cuánto margen queda?', 'How much margin remains?'),
    bi(
      'El margen bruto es (ventas − costo de ventas) / ventas. Un resultado de 0,35 equivale al 35 %.',
      'Gross margin is (revenue − cost of sales) / revenue. A result of 0.35 means 35%.',
    ),
    bi(
      'Calcula el margen bruto en B5 usando B2 y B3.',
      'Calculate gross margin in B5 using B2 and B3.',
    ),
    [['Metric', 'Amount'], ['Revenue', 80000], ['Cost', 52000], [], ['Margin', null]],
    [target('B5', '=(B2-B3)/B2', 'Margen bruto', 'Gross margin', 'percent')],
    [
      bi('Primero resta el costo de las ventas.', 'First subtract cost from revenue.'),
      bi(
        'Divide la diferencia por B2, no por el costo.',
        'Divide the difference by B2, not by cost.',
      ),
    ],
    bi(
      'El margen es 35 %. Por cada 100 UM vendidas quedan 35 UM antes de gastos operativos.',
      'The margin is 35%. Every 100 CU of sales leaves 35 CU before operating expenses.',
    ),
    [
      { B2: '120000', B3: '78000' },
      { B2: '65000', B3: '45500' },
    ],
  ),
  create(
    'foundation-03',
    'foundations',
    'medium',
    bi('Un supuesto, tres escenarios', 'One assumption, three scenarios'),
    bi(
      'Una referencia absoluta como $B$2 conserva su dirección cuando copias una fórmula. Una referencia relativa cambia con la posición.',
      'An absolute reference such as $B$2 keeps its address when you copy a formula. A relative reference changes with the position.',
    ),
    bi(
      'Proyecta en C5:C7 las ventas de B5:B7 aplicando la tasa de crecimiento de B2. Usa una referencia absoluta para el supuesto.',
      'Project revenue from B5:B7 into C5:C7 using the growth rate in B2. Use an absolute reference for the assumption.',
    ),
    [
      ['Assumption', 'Value'],
      ['Growth', 0.08],
      [],
      ['Scenario', 'Revenue', 'Forecast'],
      ['BASE', 50000, null],
      ['UPSIDE', 65000, null],
      ['DOWNSIDE', 38000, null],
    ],
    [
      target('C5', '=B5*(1+$B$2)', 'Escenario base', 'Base scenario', 'money'),
      target('C6', '=B6*(1+$B$2)', 'Escenario favorable', 'Upside scenario', 'money'),
      target('C7', '=B7*(1+$B$2)', 'Escenario adverso', 'Downside scenario', 'money'),
    ],
    [
      bi(
        'Multiplica cada venta por uno más la tasa.',
        'Multiply each revenue value by one plus the rate.',
      ),
      bi('El supuesto fijo se escribe $B$2.', 'Write the fixed assumption as $B$2.'),
    ],
    bi(
      'Un único supuesto controla los tres escenarios. Centralizar supuestos facilita revisar y auditar el modelo.',
      'One assumption controls all three scenarios. Centralizing assumptions makes the model easier to review and audit.',
    ),
    [
      { B2: '0.12', B5: '60000' },
      { B2: '-0.05', B7: '44000' },
    ],
  ),
  create(
    'foundation-04',
    'foundations',
    'hard',
    bi('Precio promedio ponderado', 'Weighted average price'),
    bi(
      'Un promedio simple puede distorsionar el precio de venta. Pondera cada precio por las unidades vendidas y redondea solo el resultado final.',
      'A simple average can distort the selling price. Weight each price by units sold and round only the final result.',
    ),
    bi(
      'Calcula en B7 el precio promedio ponderado de los tres productos, redondeado a dos decimales.',
      'Calculate the weighted average price of the three products in B7, rounded to two decimal places.',
    ),
    [
      ['Product', 'Units', 'Price'],
      ['A', 120, 15.35],
      ['B', 75, 22.8],
      ['C', 205, 9.65],
      [],
      ['Metric', 'Result'],
      ['Average', null],
    ],
    [
      target(
        'B7',
        '=ROUND(SUMPRODUCT(B2:B4,C2:C4)/SUM(B2:B4),2)',
        'Precio ponderado',
        'Weighted price',
        'money',
        0.001,
      ),
    ],
    [
      bi(
        'El numerador es la suma de unidades por precio.',
        'The numerator is the sum of units times price.',
      ),
      bi('Combina SUMAPRODUCTO, SUMA y REDONDEAR.', 'Combine SUMPRODUCT, SUM and ROUND.'),
    ],
    bi(
      'El precio ponderado es 13,83 UM. Los productos de mayor volumen tienen mayor peso en el indicador.',
      'The weighted price is 13.83 CU. Higher-volume products carry more weight in the metric.',
    ),
    [
      { B2: '200', C4: '11.2' },
      { B3: '160', C2: '18.4' },
    ],
  ),

  create(
    'logic-01',
    'logic',
    'easy',
    bi('Semáforo de presupuesto', 'Budget traffic light'),
    logicLesson,
    bi(
      'En D2, devuelve "REVIEW" si el gasto real C2 supera el presupuesto B2; en otro caso devuelve "OK".',
      'In D2, return "REVIEW" if actual expense C2 exceeds budget B2; otherwise return "OK".',
    ),
    [
      ['Team', 'Budget', 'Actual', 'Status'],
      ['OPS', 25000, 28000, null],
    ],
    [target('D2', '=IF(C2>B2,"REVIEW","OK")', 'Control presupuestal', 'Budget control')],
    [
      bi('Compara C2 > B2.', 'Compare C2 > B2.'),
      bi('Los textos deben ir entre comillas dobles.', 'Text values need double quotes.'),
    ],
    bi(
      'REVIEW señala una desviación que merece análisis; no implica por sí sola una mala decisión.',
      'REVIEW flags a variance worth investigating; it does not by itself imply a poor decision.',
    ),
    [{ C2: '22000' }, { C2: '25000' }],
  ),
  create(
    'logic-02',
    'logic',
    'easy',
    bi('Un ratio sin errores', 'An error-free ratio'),
    logicLesson,
    bi(
      'Calcula C2/B2 en D2. Si la división produce un error, devuelve 0 con SI.ERROR.',
      'Calculate C2/B2 in D2. If the division produces an error, return 0 using IFERROR.',
    ),
    [
      ['Team', 'Budget', 'Actual', 'Ratio'],
      ['NEW', 0, 1800, null],
    ],
    [target('D2', '=IFERROR(C2/B2,0)', 'Ratio de ejecución', 'Execution ratio', 'percent')],
    [
      bi('Una división entre cero produce un error.', 'Division by zero produces an error.'),
      bi(
        'El primer argumento de SI.ERROR es C2/B2 y el segundo es 0.',
        'The first IFERROR argument is C2/B2 and the second is 0.',
      ),
    ],
    bi(
      'Mostrar 0 evita romper el reporte, pero hay que investigar el presupuesto ausente. No confundas la ausencia de base con ausencia de gasto.',
      'Displaying 0 avoids breaking the report, but the missing budget needs investigation. A missing base does not mean no spending.',
    ),
    [{ B2: '2000' }, { B2: '3000', C2: '2700' }],
  ),
  create(
    'logic-03',
    'logic',
    'medium',
    bi('Dos condiciones para aprobar', 'Two conditions to approve'),
    logicLesson,
    bi(
      'Devuelve "OK" en D2 solo si B2 es menor o igual a 5000 y C2 es "YES". En otro caso devuelve "REVIEW".',
      'Return "OK" in D2 only if B2 is at most 5000 and C2 equals "YES". Otherwise return "REVIEW".',
    ),
    [
      ['Request', 'Amount', 'Approved', 'Status'],
      ['REQ-042', 4200, 'YES', null],
    ],
    [
      target(
        'D2',
        '=IF(AND(B2<=5000,C2="YES"),"OK","REVIEW")',
        'Control de aprobación',
        'Approval control',
      ),
    ],
    [
      bi(
        'Y exige que ambas condiciones sean verdaderas.',
        'AND requires both conditions to be true.',
      ),
      bi('Combina SI con Y(B2<=5000;C2="YES").', 'Combine IF with AND(B2<=5000,C2="YES").'),
    ],
    bi(
      'El control combina un límite monetario y una aprobación documental. Ambos son necesarios.',
      'The control combines a monetary limit with documented approval. Both are required.',
    ),
    [{ B2: '6000' }, { C2: 'NO' }],
  ),
  create(
    'logic-04',
    'logic',
    'hard',
    bi('Prioriza las excepciones', 'Prioritize exceptions'),
    logicLesson,
    bi(
      'En D2 devuelve "MISSING" si B2 es cero. Si no, devuelve "REVIEW" cuando C2/B2 supera 1,1 o C2 supera 50000; si no, "OK".',
      'In D2 return "MISSING" if B2 is zero. Otherwise return "REVIEW" when C2/B2 exceeds 1.1 or C2 exceeds 50000; otherwise return "OK".',
    ),
    [
      ['Team', 'Budget', 'Actual', 'Status'],
      ['OPS', 45000, 51000, null],
    ],
    [
      target(
        'D2',
        '=IF(B2=0,"MISSING",IF(OR(C2/B2>1.1,C2>50000),"REVIEW","OK"))',
        'Prioridad de revisión',
        'Review priority',
      ),
    ],
    [
      bi('Revisa el presupuesto cero antes de dividir.', 'Check for zero budget before dividing.'),
      bi(
        'Anida otro SI con O para evaluar las dos alertas.',
        'Nest another IF with OR to evaluate both alerts.',
      ),
    ],
    bi(
      'Ordenar las condiciones evita divisiones inválidas y distingue información faltante de desviaciones operativas.',
      'Ordering the conditions avoids invalid division and distinguishes missing information from operating variances.',
    ),
    [{ B2: '0' }, { B2: '50000', C2: '49000' }, { B2: '60000', C2: '51000' }],
  ),

  create(
    'aggregation-01',
    'aggregation',
    'easy',
    bi('El costo de operaciones', 'The cost of operations'),
    conditionalLesson,
    bi(
      'Suma en B8 los importes de B2:B6 cuyo centro en A2:A6 sea "OPS".',
      'In B8, sum amounts in B2:B6 whose team in A2:A6 is "OPS".',
    ),
    [
      ['Team', 'Amount'],
      ['OPS', 4200],
      ['SALES', 3100],
      ['OPS', 2800],
      ['TECH', 5300],
      ['OPS', 1600],
      [],
      ['Total', null],
    ],
    [
      target(
        'B8',
        '=SUMIF(A2:A6,"OPS",B2:B6)',
        'Gasto de operaciones',
        'Operations expense',
        'money',
      ),
    ],
    [
      bi('El criterio se aplica al rango A2:A6.', 'The criterion applies to A2:A6.'),
      bi(
        'SUMAR.SI recibe rango, criterio y rango de suma.',
        'SUMIF takes range, criterion and sum range.',
      ),
    ],
    bi(
      'OPS suma 8.600 UM. Segmentar el gasto permite asignar responsables y comparar áreas.',
      'OPS totals 8,600 CU. Segmenting expenses allows ownership and team comparisons.',
    ),
    [
      { B2: '6200', B5: '9000' },
      { A3: 'OPS', B6: '2200' },
    ],
  ),
  create(
    'aggregation-02',
    'aggregation',
    'easy',
    bi('Cuenta las alertas', 'Count the alerts'),
    conditionalLesson,
    bi(
      'Cuenta en B8 cuántos importes de B2:B6 superan 5000.',
      'In B8, count how many amounts in B2:B6 exceed 5000.',
    ),
    [
      ['Invoice', 'Amount'],
      ['INV-01', 7200],
      ['INV-02', 1800],
      ['INV-03', 5100],
      ['INV-04', 5000],
      ['INV-05', 9200],
      [],
      ['Count', null],
    ],
    [target('B8', '=COUNTIF(B2:B6,">5000")', 'Facturas por revisar', 'Invoices to review')],
    [
      bi('El límite es estricto: 5000 no cuenta.', 'The threshold is strict: 5000 does not count.'),
      bi(
        'El criterio ">5000" es un texto entre comillas.',
        'The criterion ">5000" is a quoted string.',
      ),
    ],
    bi(
      'Hay tres facturas por encima del umbral. Un conteo mide volumen de trabajo, no exposición monetaria.',
      'Three invoices exceed the threshold. A count measures workload, not monetary exposure.',
    ),
    [
      { B2: '4000', B3: '6000' },
      { B4: '2000', B6: '3000' },
    ],
  ),
  create(
    'aggregation-03',
    'aggregation',
    'medium',
    bi('Gasto por equipo y mes', 'Expense by team and month'),
    conditionalLesson,
    bi(
      'Suma en B9 el gasto de OPS correspondiente a FEB usando los tres rangos de datos.',
      'In B9, sum OPS expenses for FEB using all three data ranges.',
    ),
    [
      ['Team', 'Month', 'Amount'],
      ['OPS', 'JAN', 4000],
      ['OPS', 'FEB', 4500],
      ['SALES', 'FEB', 6200],
      ['OPS', 'FEB', 1800],
      ['TECH', 'FEB', 3000],
      ['OPS', 'MAR', 5200],
      [],
      ['Total', null],
    ],
    [
      target(
        'B9',
        '=SUMIFS(C2:C7,A2:A7,"OPS",B2:B7,"FEB")',
        'Gasto de febrero OPS',
        'OPS February expense',
        'money',
      ),
    ],
    [
      bi('SUMAR.SI.CONJUNTO empieza con el rango a sumar.', 'SUMIFS starts with the sum range.'),
      bi(
        'Añade el criterio OPS para A y FEB para B.',
        'Add the OPS criterion for A and FEB for B.',
      ),
    ],
    bi(
      'Los dos criterios deben cumplirse a la vez. El gasto de OPS en febrero es 6.300 UM.',
      'Both criteria must hold simultaneously. OPS expense in February is 6,300 CU.',
    ),
    [
      { C3: '7000', C5: '2300' },
      { A4: 'OPS', B7: 'FEB' },
    ],
  ),
  create(
    'aggregation-04',
    'aggregation',
    'hard',
    bi('Materialidad por centro', 'Materiality by team'),
    conditionalLesson,
    bi(
      'En B9 suma el gasto de OPS mayor a 3000. En B10 cuenta cuántos registros de OPS superan ese límite.',
      'In B9 sum OPS expenses above 3000. In B10 count how many OPS records exceed that threshold.',
    ),
    [
      ['Team', 'Amount'],
      ['OPS', 4200],
      ['SALES', 7100],
      ['OPS', 3000],
      ['OPS', 5800],
      ['TECH', 4000],
      ['OPS', 1200],
      [],
      ['Total', null],
      ['Count', null],
    ],
    [
      target(
        'B9',
        '=SUMIFS(B2:B7,A2:A7,"OPS",B2:B7,">3000")',
        'Importe material',
        'Material amount',
        'money',
      ),
      target('B10', '=COUNTIFS(A2:A7,"OPS",B2:B7,">3000")', 'Número de registros', 'Record count'),
    ],
    [
      bi(
        'Aplica los mismos dos criterios a la suma y al conteo.',
        'Apply the same two criteria to the sum and the count.',
      ),
      bi('Usa SUMAR.SI.CONJUNTO y CONTAR.SI.CONJUNTO.', 'Use SUMIFS and COUNTIFS.'),
    ],
    bi(
      'Dos registros suman 10.000 UM. Combinar importe y frecuencia ayuda a priorizar revisiones.',
      'Two records total 10,000 CU. Combining value and frequency helps prioritize reviews.',
    ),
    [{ B4: '3500' }, { A3: 'OPS', B5: '2500' }],
  ),

  create(
    'lookup-01',
    'lookups',
    'easy',
    bi('Encuentra el centro de costo', 'Find the cost center'),
    lookupLesson,
    bi(
      'Busca el código de B7 en A2:A4 y devuelve en B8 su presupuesto de B2:B4 usando coincidencia exacta.',
      'Find the code in B7 within A2:A4 and return its budget from B2:B4 into B8 using exact matching.',
    ),
    [
      ['Code', 'Budget'],
      ['OPS', 24000],
      ['SALES', 18000],
      ['TECH', 32000],
      [],
      ['Metric', 'Value'],
      ['Code', 'SALES'],
      ['Budget', null],
    ],
    [
      target(
        'B8',
        '=VLOOKUP(B7,A2:B4,2,FALSE)',
        'Presupuesto encontrado',
        'Matched budget',
        'money',
      ),
    ],
    [
      bi('La segunda columna contiene el presupuesto.', 'The second column contains the budget.'),
      bi(
        'En BUSCARV, FALSO exige coincidencia exacta.',
        'In VLOOKUP, FALSE requires exact matching.',
      ),
    ],
    bi(
      'SALES tiene un presupuesto de 18.000 UM. La coincidencia exacta evita asignar el dato de otro centro.',
      'SALES has a budget of 18,000 CU. Exact matching avoids assigning another team’s data.',
    ),
    [{ B7: 'TECH' }, { B3: '21000' }],
  ),
  create(
    'lookup-02',
    'lookups',
    'easy',
    bi('Una búsqueda moderna', 'A modern lookup'),
    lookupLesson,
    bi(
      'En B8 busca B7 en A2:A4 y devuelve el importe de B2:B4. Si no existe, devuelve "MISSING".',
      'In B8 look up B7 in A2:A4 and return the amount from B2:B4. If absent, return "MISSING".',
    ),
    [
      ['Code', 'Amount'],
      ['A-100', 1200],
      ['A-200', 2400],
      ['A-300', 3600],
      [],
      ['Metric', 'Value'],
      ['Code', 'A-200'],
      ['Amount', null],
    ],
    [target('B8', '=XLOOKUP(B7,A2:A4,B2:B4,"MISSING")', 'Importe del código', 'Code amount')],
    [
      bi(
        'BUSCARX separa el rango buscado del rango devuelto.',
        'XLOOKUP separates the lookup and return ranges.',
      ),
      bi(
        'El cuarto argumento define qué mostrar si falta el código.',
        'The fourth argument specifies what to show for a missing code.',
      ),
    ],
    bi(
      'Una salida explícita para datos ausentes facilita investigar excepciones sin esconderlas como ceros.',
      'An explicit result for missing data helps investigate exceptions without hiding them as zeros.',
    ),
    [{ B7: 'A-300' }, { B7: 'A-999' }],
  ),
  create(
    'lookup-03',
    'lookups',
    'medium',
    bi('Un cruce flexible', 'A flexible match'),
    lookupLesson,
    bi(
      'En B8 devuelve el margen de C2:C4 correspondiente al producto de B7. Combina INDICE y COINCIDIR exacto.',
      'In B8 return the margin from C2:C4 for the product in B7. Combine INDEX and exact MATCH.',
    ),
    [
      ['Code', 'Revenue', 'Margin'],
      ['P-01', 30000, 0.25],
      ['P-02', 42000, 0.32],
      ['P-03', 18000, 0.18],
      [],
      ['Metric', 'Value'],
      ['Code', 'P-02'],
      ['Margin', null],
    ],
    [
      target(
        'B8',
        '=INDEX(C2:C4,MATCH(B7,A2:A4,0))',
        'Margen del producto',
        'Product margin',
        'percent',
      ),
    ],
    [
      bi('COINCIDIR devuelve la posición del código.', 'MATCH returns the code’s position.'),
      bi(
        'INDICE devuelve el valor de esa posición en C2:C4.',
        'INDEX returns the value at that position in C2:C4.',
      ),
    ],
    bi(
      'El margen de P-02 es 32 %. Separar búsqueda y retorno permite reorganizar las columnas del catálogo.',
      'P-02 has a 32% margin. Separating lookup and return allows catalog columns to be reorganized.',
    ),
    [{ B7: 'P-01' }, { C3: '0.41' }],
  ),
  create(
    'lookup-04',
    'lookups',
    'hard',
    bi('Conciliación con tolerancia', 'Reconciliation with tolerance'),
    lookupLesson,
    bi(
      'En C8 devuelve el importe del código B8 o 0 si falta. En D8 devuelve "OK" si la diferencia absoluta frente a B9 es menor o igual a 0,01; en otro caso "REVIEW".',
      'In C8 return the amount for code B8 or 0 if absent. In D8 return "OK" if the absolute difference from B9 is at most 0.01; otherwise "REVIEW".',
    ),
    [
      ['Code', 'Amount'],
      ['INV-01', 1200],
      ['INV-02', 2350.5],
      ['INV-03', 890],
      [],
      ['Metric', 'Value'],
      [],
      ['Code', 'INV-02', null, null],
      ['Recorded', 2350.5],
    ],
    [
      target(
        'C8',
        '=XLOOKUP(B8,A2:A4,B2:B4,0)',
        'Importe de referencia',
        'Reference amount',
        'money',
      ),
      target(
        'D8',
        '=IF(ABS(C8-B9)<=0.01,"OK","REVIEW")',
        'Resultado de conciliación',
        'Reconciliation result',
      ),
    ],
    [
      bi('Primero resuelve la búsqueda en C8.', 'First complete the lookup in C8.'),
      bi(
        'ABS permite comparar diferencias positivas y negativas.',
        'ABS compares positive and negative differences alike.',
      ),
    ],
    bi(
      'La tolerancia evita alertas por diferencias insignificantes de redondeo; no reemplaza una política de materialidad.',
      'Tolerance avoids alerts from insignificant rounding differences; it does not replace a materiality policy.',
    ),
    [{ B9: '2350.52' }, { B8: 'INV-01', B9: '1200' }],
  ),

  create(
    'data-01',
    'data',
    'easy',
    bi('Un catálogo limpio', 'A clean catalog'),
    bi(
      'ESPACIOS elimina espacios iniciales y finales y reduce los espacios internos repetidos. MAYUSC normaliza la capitalización.',
      'TRIM removes leading and trailing spaces and reduces repeated internal spaces. UPPER normalizes capitalization.',
    ),
    bi(
      'Normaliza A2 en B2: elimina los espacios sobrantes y convierte el texto a mayúsculas.',
      'Normalize A2 in B2: remove extra spaces and convert the text to uppercase.',
    ),
    [
      ['Raw', 'Clean'],
      ['  ops   north  ', null],
    ],
    [target('B2', '=UPPER(TRIM(A2))', 'Código normalizado', 'Normalized code')],
    [
      bi(
        'Primero elimina espacios; después cambia las letras.',
        'First remove spaces, then change letter case.',
      ),
      bi('Anida ESPACIOS dentro de MAYUSC.', 'Nest TRIM inside UPPER.'),
    ],
    bi(
      'OPS NORTH es un identificador consistente. La calidad del catálogo condiciona la calidad de los cruces.',
      'OPS NORTH is a consistent identifier. Catalog quality determines matching quality.',
    ),
    [{ A2: '  sales   west ' }, { A2: 'tech  south' }],
  ),
  create(
    'data-02',
    'data',
    'easy',
    bi('Descompón una referencia', 'Break down a reference'),
    bi(
      'IZQUIERDA y DERECHA extraen caracteres desde los extremos de un texto. Los códigos son cadenas, incluso cuando contienen dígitos.',
      'LEFT and RIGHT extract characters from either end of a text string. Codes are strings even when they contain digits.',
    ),
    bi(
      'De A2 extrae los tres primeros caracteres en B2 y los cuatro últimos en C2.',
      'From A2 extract the first three characters into B2 and the last four into C2.',
    ),
    [
      ['Code', 'Team', 'Number'],
      ['OPS-2026-0042', null, null],
    ],
    [
      target('B2', '=LEFT(A2,3)', 'Centro', 'Team'),
      target('C2', '=RIGHT(A2,4)', 'Consecutivo', 'Sequence'),
    ],
    [
      bi(
        'El segundo argumento indica cuántos caracteres extraer.',
        'The second argument specifies the number of characters.',
      ),
      bi('Usa 3 en IZQUIERDA y 4 en DERECHA.', 'Use 3 in LEFT and 4 in RIGHT.'),
    ],
    bi(
      'Conservar 0042 como texto mantiene los ceros iniciales, importantes para identificar documentos.',
      'Keeping 0042 as text preserves leading zeros, which matter for document identification.',
    ),
    [{ A2: 'TEC-2025-0088' }, { A2: 'SAL-2027-1200' }],
  ),
  create(
    'data-03',
    'data',
    'medium',
    bi('La fecha del cierre', 'The closing date'),
    timeLesson,
    bi(
      'Construye en D2 el último día del mes definido por el año B2 y el mes C2. Usa FECHA y FIN.MES.',
      'In D2 construct the final day of the month defined by year B2 and month C2. Use DATE and EOMONTH.',
    ),
    [
      ['Period', 'Year', 'Month', 'Close'],
      ['P1', 2026, 2, null],
    ],
    [target('D2', '=EOMONTH(DATE(B2,C2,1),0)', 'Fecha de cierre', 'Closing date', 'date')],
    [
      bi('Construye primero el día 1 del mes.', 'First construct the first day of the month.'),
      bi(
        'FIN.MES con desplazamiento 0 devuelve el cierre de ese mes.',
        'EOMONTH with offset 0 returns that month’s closing date.',
      ),
    ],
    bi(
      'Febrero de 2026 cierra el día 28. Calcular el cierre evita suponer que todos los meses tienen 30 días.',
      'February 2026 closes on the 28th. Calculating the closing date avoids assuming every month has 30 days.',
    ),
    [{ B2: '2028' }, { C2: '4' }],
  ),
  create(
    'data-04',
    'data',
    'hard',
    bi('Cartera vencida', 'Overdue receivables'),
    timeLesson,
    bi(
      'Calcula en D2:D4 los días vencidos al corte de B7: resta la fecha de vencimiento al corte y limita el resultado a cero.',
      'Calculate days overdue in D2:D4 at the cutoff in B7: subtract the due date from the cutoff and limit the result to zero.',
    ),
    [
      ['Invoice', 'Due date', 'Amount', 'Days overdue'],
      ['INV-01', '=DATE(2026,3,10)', 1200, null],
      ['INV-02', '=DATE(2026,3,31)', 2400, null],
      ['INV-03', '=DATE(2026,4,15)', 3600, null],
      [],
      ['Metric', 'Value'],
      ['Cutoff', '=DATE(2026,3,31)'],
    ],
    [
      target('D2', '=MAX(0,$B$7-B2)', 'Días INV-01', 'Days INV-01'),
      target('D3', '=MAX(0,$B$7-B3)', 'Días INV-02', 'Days INV-02'),
      target('D4', '=MAX(0,$B$7-B4)', 'Días INV-03', 'Days INV-03'),
    ],
    [
      bi(
        'Fija el corte con $B$7 para todas las facturas.',
        'Fix the cutoff with $B$7 for every invoice.',
      ),
      bi(
        'MAX(0;diferencia) evita días negativos para facturas futuras.',
        'MAX(0,difference) avoids negative days for future invoices.',
      ),
    ],
    bi(
      'Solo INV-01 tiene 21 días vencidos al corte. El indicador depende de una fecha de corte explícita y reproducible.',
      'Only INV-01 is 21 days overdue at the cutoff. The metric depends on an explicit, reproducible cutoff date.',
    ),
    [{ B7: '=DATE(2026,4,30)' }, { B2: '=DATE(2026,3,30)', B7: '=DATE(2026,4,1)' }],
  ),

  create(
    'finance-01',
    'finance',
    'easy',
    bi('La cuota del crédito', 'The loan installment'),
    financeLesson,
    bi(
      'Calcula en B6 la cuota mensual positiva de un crédito de B2, tasa anual nominal B3 y plazo en meses B4. Usa PAGO.',
      'In B6 calculate the positive monthly installment for principal B2, nominal annual rate B3 and term in months B4. Use PMT.',
    ),
    [
      ['Assumption', 'Value'],
      ['Principal', 12000],
      ['Annual rate', 0.12],
      ['Months', 12],
      [],
      ['Payment', null],
    ],
    [target('B6', '=-PMT(B3/12,B4,B2)', 'Cuota mensual', 'Monthly payment', 'money', 0.0001)],
    [
      bi('La tasa mensual nominal es B3/12.', 'The nominal monthly rate is B3/12.'),
      bi(
        'PAGO devuelve una salida negativa; cambia el signo para mostrar la cuota positiva.',
        'PMT returns a negative outflow; reverse the sign to display a positive installment.',
      ),
    ],
    bi(
      'La cuota combina capital e intereses. Dividir una tasa nominal anual entre 12 supone capitalización mensual.',
      'The installment combines principal and interest. Dividing a nominal annual rate by 12 assumes monthly compounding.',
    ),
    [{ B2: '18000', B4: '24' }, { B3: '0.18' }],
  ),
  create(
    'finance-02',
    'finance',
    'easy',
    bi('El valor de un cobro futuro', 'The value of a future receipt'),
    financeLesson,
    bi(
      'Descuenta en B6 el cobro futuro de B2 usando la tasa anual B3 y los años B4. Devuelve un valor presente positivo.',
      'In B6 discount the future receipt in B2 using annual rate B3 and years B4. Return a positive present value.',
    ),
    [
      ['Assumption', 'Value'],
      ['Future value', 15000],
      ['Annual rate', 0.1],
      ['Years', 3],
      [],
      ['Present value', null],
    ],
    [target('B6', '=PV(B3,B4,0,-B2)', 'Valor presente', 'Present value', 'money', 0.0001)],
    [
      bi(
        'No existen pagos intermedios: el pago periódico es 0.',
        'There are no interim payments: the periodic payment is 0.',
      ),
      bi(
        'Usa el valor futuro con signo negativo para obtener un valor presente positivo.',
        'Use a negative future value to obtain a positive present value.',
      ),
    ],
    bi(
      'A una tasa de descuento positiva, el cobro futuro vale menos hoy. La tasa representa el costo de oportunidad supuesto.',
      'At a positive discount rate, a future receipt is worth less today. The rate represents the assumed opportunity cost.',
    ),
    [{ B3: '0.15' }, { B2: '20000', B4: '5' }],
  ),
  create(
    'finance-03',
    'finance',
    'medium',
    bi('¿La inversión crea valor?', 'Does the investment create value?'),
    financeLesson,
    bi(
      'Calcula en B9 el VAN a la tasa B2. El flujo inicial está en B4 y los flujos de final de año en B5:B7.',
      'In B9 calculate NPV at rate B2. The initial cash flow is in B4 and year-end cash flows are in B5:B7.',
    ),
    [
      ['Assumption', 'Value'],
      ['Rate', 0.1],
      ['Year', 'Cash flow'],
      [0, -10000],
      [1, 4000],
      [2, 4500],
      [3, 5000],
      [],
      ['NPV', null],
    ],
    [target('B9', '=NPV(B2,B5:B7)+B4', 'Valor actual neto', 'Net present value', 'money', 0.0001)],
    [
      bi(
        'VNA descuenta los flujos desde el final del primer periodo.',
        'NPV discounts cash flows from the end of the first period.',
      ),
      bi(
        'Añade B4 fuera de VNA porque ocurre en el momento cero.',
        'Add B4 outside NPV because it occurs at time zero.',
      ),
    ],
    bi(
      'El desembolso inicial se suma sin descontar. Un VAN positivo indica valor creado bajo los supuestos del caso.',
      'The initial outlay is added without discounting. A positive NPV indicates value creation under the case assumptions.',
    ),
    [{ B4: '-12000' }, { B2: '0.18', B6: '6000' }],
  ),
  create(
    'finance-04',
    'finance',
    'hard',
    bi('Rentabilidad frente al umbral', 'Return versus the hurdle rate'),
    financeLesson,
    bi(
      'Calcula la TIR de B4:B7 en B9. En B10 devuelve "OK" si la TIR supera B2; si no, "REVIEW".',
      'Calculate IRR for B4:B7 in B9. In B10 return "OK" if IRR exceeds B2; otherwise return "REVIEW".',
    ),
    [
      ['Assumption', 'Value'],
      ['Hurdle rate', 0.12],
      ['Year', 'Cash flow'],
      [0, -10000],
      [1, 4000],
      [2, 4500],
      [3, 5000],
      [],
      ['IRR', null],
      ['Status', null],
    ],
    [
      target(
        'B9',
        '=IRR(B4:B7)',
        'Tasa interna de retorno',
        'Internal rate of return',
        'percent',
        0.000001,
      ),
      target('B10', '=IF(B9>B2,"OK","REVIEW")', 'Decisión preliminar', 'Preliminary decision'),
    ],
    [
      bi(
        'La TIR incluye el desembolso inicial negativo.',
        'IRR includes the negative initial outlay.',
      ),
      bi(
        'Compara B9 con la tasa mínima B2 dentro de SI.',
        'Compare B9 with hurdle rate B2 inside IF.',
      ),
    ],
    bi(
      'La TIR es la tasa que hace el VAN igual a cero. Para flujos convencionales sirve como complemento del VAN, sin reemplazar el análisis de riesgo.',
      'IRR is the rate that makes NPV zero. For conventional cash flows it complements NPV without replacing risk analysis.',
    ),
    [{ B2: '0.4' }, { B5: '3000', B6: '3500', B7: '4000' }],
  ),

  create(
    'case-budget',
    'cases',
    'case',
    bi('Un presupuesto bajo la lupa', 'A budget under the microscope'),
    bi(
      'Eres analista de FP&A. Debes explicar el gasto de tres equipos al director financiero. Una desviación positiva significa gasto por encima del presupuesto.',
      'You are an FP&A analyst explaining three teams’ spending to the CFO. A positive variance means spending above budget.',
    ),
    bi(
      'Completa D2:D4 con real menos presupuesto; E2:E4 con desviación / presupuesto; B7 y C7 con totales; D7 con la desviación total. Responde la pregunta de interpretación.',
      'Fill D2:D4 with actual minus budget; E2:E4 with variance / budget; B7 and C7 with totals; D7 with total variance. Answer the interpretation question.',
    ),
    [
      ['Team', 'Budget', 'Actual', 'Variance', 'Variance %'],
      ['OPS', 25000, 28000, null, null],
      ['SALES', 20000, 18500, null, null],
      ['TECH', 35000, 36000, null, null],
      [],
      [],
      ['Total', null, null, null],
    ],
    [
      target('D2', '=C2-B2', 'Desviación OPS', 'OPS variance', 'money'),
      target('D3', '=C3-B3', 'Desviación SALES', 'SALES variance', 'money'),
      target('D4', '=C4-B4', 'Desviación TECH', 'TECH variance', 'money'),
      target('E2', '=D2/B2', 'Desviación % OPS', 'OPS variance %', 'percent'),
      target('E3', '=D3/B3', 'Desviación % SALES', 'SALES variance %', 'percent'),
      target('E4', '=D4/B4', 'Desviación % TECH', 'TECH variance %', 'percent'),
      target('B7', '=SUM(B2:B4)', 'Presupuesto total', 'Total budget', 'money'),
      target('C7', '=SUM(C2:C4)', 'Gasto total', 'Total actual', 'money'),
      target('D7', '=C7-B7', 'Desviación total', 'Total variance', 'money'),
    ],
    [
      bi(
        'Mantén la misma convención de signos en todas las filas.',
        'Keep the same sign convention in every row.',
      ),
      bi(
        'La desviación porcentual usa el presupuesto como denominador.',
        'Percentage variance uses budget as the denominator.',
      ),
    ],
    bi(
      'El gasto total supera el presupuesto en 2.500 UM. OPS explica 3.000 UM de sobrecosto y SALES compensa parte con un ahorro de 1.500 UM.',
      'Total expense exceeds budget by 2,500 CU. OPS accounts for a 3,000 CU overrun, partly offset by 1,500 CU of SALES savings.',
    ),
    [
      { C2: '29000', C3: '19000' },
      { B4: '40000', C4: '40500' },
    ],
    {
      question: bi(
        'Con los datos originales, ¿qué equipo priorizarías para explicar el sobrecosto?',
        'Using the original data, which team would you prioritize to explain the overrun?',
      ),
      options: [
        bi(
          'OPS: mayor desviación absoluta y porcentual.',
          'OPS: the largest absolute and percentage overrun.',
        ),
        bi('TECH: tiene el presupuesto más grande.', 'TECH: it has the largest budget.'),
        bi('SALES: gastó menos que su presupuesto.', 'SALES: it spent less than its budget.'),
      ],
      answer: 0,
      explanation: bi(
        'OPS excede el presupuesto en 3.000 UM, un 12 %. Priorizar solo por tamaño del presupuesto ocultaría la desviación más relevante.',
        'OPS exceeds budget by 3,000 CU, or 12%. Prioritizing only by budget size would obscure the most relevant variance.',
      ),
    },
  ),
  create(
    'case-cash',
    'cases',
    'case',
    bi('Seis meses de caja', 'Six months of cash'),
    bi(
      'La utilidad y la caja no son lo mismo. Proyecta saldos usando cobros y pagos efectivos, con un saldo inicial de 5.000 UM.',
      'Profit and cash are different. Project balances using actual receipts and payments, starting with 5,000 CU.',
    ),
    bi(
      'Completa D2:D7 con cobros menos pagos. Calcula E2 con el saldo inicial B10 más D2; en E3:E7 acumula el saldo anterior más el flujo del mes. Calcula el saldo mínimo en B11.',
      'Fill D2:D7 with receipts minus payments. Calculate E2 as opening balance B10 plus D2; in E3:E7 add each month’s flow to the previous balance. Calculate the minimum balance in B11.',
    ),
    [
      ['Month', 'Receipts', 'Payments', 'Net flow', 'Balance'],
      ['JAN', 12000, 14000, null, null],
      ['FEB', 10000, 16000, null, null],
      ['MAR', 17000, 13000, null, null],
      ['APR', 19000, 15000, null, null],
      ['MAY', 20000, 17000, null, null],
      ['JUN', 22000, 18000, null, null],
      [],
      ['Assumption', 'Value'],
      ['Opening balance', 5000],
      ['Minimum balance', null],
    ],
    [
      ...Array.from({ length: 6 }, (_, i) =>
        target(`D${i + 2}`, `=B${i + 2}-C${i + 2}`, `Flujo ${i + 1}`, `Flow ${i + 1}`, 'money'),
      ),
      target('E2', '=$B$10+D2', 'Saldo inicial proyectado', 'First projected balance', 'money'),
      ...Array.from({ length: 5 }, (_, i) =>
        target(`E${i + 3}`, `=E${i + 2}+D${i + 3}`, `Saldo ${i + 2}`, `Balance ${i + 2}`, 'money'),
      ),
      target('B11', '=MIN(E2:E7)', 'Saldo mínimo', 'Minimum balance', 'money'),
    ],
    [
      bi(
        'El saldo se acumula; no reinicies con el saldo inicial cada mes.',
        'Balances accumulate; do not restart from the opening balance each month.',
      ),
      bi(
        'El segundo saldo es E2+D3. Usa MIN para identificar el déficit máximo.',
        'The second balance is E2+D3. Use MIN to identify the largest deficit.',
      ),
    ],
    bi(
      'Febrero termina con −3.000 UM aunque junio termine con caja positiva. Hace falta anticipar financiamiento o ajustar cobros y pagos antes del déficit.',
      'February ends at −3,000 CU even though June ends with positive cash. Financing or adjustments to collections and payments must be arranged before the deficit.',
    ),
    [{ B10: '8000' }, { B3: '15000', C5: '18000' }],
    {
      question: bi(
        'Con los datos originales, ¿cuál es la necesidad de liquidez mínima identificada?',
        'Using the original data, what minimum liquidity need is identified?',
      ),
      options: [
        bi(
          'Ninguna: junio termina con saldo positivo.',
          'None: June ends with a positive balance.',
        ),
        bi('3.000 UM para cubrir el déficit de febrero.', '3,000 CU to cover February’s deficit.'),
        bi(
          'La suma de todos los pagos del semestre.',
          'The sum of all payments in the six-month period.',
        ),
      ],
      answer: 1,
      explanation: bi(
        'El mínimo acumulado es −3.000 UM. El saldo final por sí solo no revela los déficits intermedios.',
        'The minimum cumulative balance is −3,000 CU. The closing balance alone does not reveal interim deficits.',
      ),
    },
  ),
  create(
    'case-investment',
    'cases',
    'case',
    bi('La decisión de invertir', 'The investment decision'),
    bi(
      'Evalúa un proyecto con flujos anuales convencionales, inversión inicial negativa y cobros posteriores positivos. La tasa del caso es un supuesto educativo.',
      'Evaluate a project with conventional annual cash flows: a negative initial investment followed by positive receipts. The case rate is an educational assumption.',
    ),
    bi(
      'En B10 calcula el VAN con tasa B2 y flujos B5:B8. En B11 calcula la TIR incluyendo B4. En B12 devuelve "OK" si el VAN es positivo y la TIR supera B2; si no, "REVIEW".',
      'In B10 calculate NPV at rate B2 using flows B5:B8. In B11 calculate IRR including B4. In B12 return "OK" if NPV is positive and IRR exceeds B2; otherwise return "REVIEW".',
    ),
    [
      ['Assumption', 'Value'],
      ['Rate', 0.12],
      ['Year', 'Cash flow'],
      [0, -50000],
      [1, 18000],
      [2, 20000],
      [3, 22000],
      [4, 24000],
      [],
      ['NPV', null],
      ['IRR', null],
      ['Status', null],
    ],
    [
      target('B10', '=NPV(B2,B5:B8)+B4', 'VAN del proyecto', 'Project NPV', 'money', 0.0001),
      target('B11', '=IRR(B4:B8)', 'TIR del proyecto', 'Project IRR', 'percent', 0.000001),
      target(
        'B12',
        '=IF(AND(B10>0,B11>B2),"OK","REVIEW")',
        'Evaluación financiera',
        'Financial evaluation',
      ),
    ],
    [
      bi(
        'VNA excluye el flujo inicial; TIR sí lo incluye.',
        'NPV excludes the initial flow; IRR includes it.',
      ),
      bi(
        'Combina las dos condiciones con Y dentro de SI.',
        'Combine both conditions with AND inside IF.',
      ),
    ],
    bi(
      'El caso crea valor bajo los supuestos establecidos. Antes de invertir, el análisis debe incorporar sensibilidad, riesgos y restricciones de capital.',
      'The case creates value under the stated assumptions. Before investing, analysis must consider sensitivity, risks and capital constraints.',
    ),
    [{ B2: '0.35' }, { B4: '-65000', B8: '30000' }],
    {
      question: bi(
        '¿Qué conclusión es defendible con los datos originales?',
        'Which conclusion is defensible using the original data?',
      ),
      options: [
        bi(
          'La inversión es libre de riesgo porque el VAN es positivo.',
          'The investment is risk-free because NPV is positive.',
        ),
        bi('La TIR garantiza los cobros proyectados.', 'IRR guarantees the projected receipts.'),
        bi(
          'Crea valor con estos supuestos; todavía hay que evaluar sensibilidad y riesgo.',
          'It creates value under these assumptions; sensitivity and risk still need evaluation.',
        ),
      ],
      answer: 2,
      explanation: bi(
        'VAN y TIR dependen de proyecciones. Ninguno garantiza flujos ni elimina riesgos.',
        'NPV and IRR depend on projections. Neither guarantees cash flows nor eliminates risks.',
      ),
    },
  ),
];

for (const t of challenges.find((c) => c.id === 'foundation-03')!.targets) t.absoluteRefs = ['B2'];
for (const module of modules) {
  const group = challenges.filter((c) => c.module === module.id);
  group.forEach((c, i) => {
    c.prerequisiteIds = i
      ? [group[i - 1].id]
      : module.id === 'foundations'
        ? []
        : ['foundation-02'];
  });
}
for (const c of challenges.filter((c) => c.difficulty === 'case'))
  c.prerequisiteIds =
    c.id === 'case-investment'
      ? ['finance-04']
      : c.id === 'case-budget'
        ? ['aggregation-04']
        : ['foundation-03', 'logic-02'];
export const findChallenge = (id: string) => challenges.find((c) => c.id === id);
export const totalPoints = challenges.reduce(
  (sum, c) => sum + { easy: 10, medium: 20, hard: 30, case: 100 }[c.difficulty],
  0,
);

// Data codes remain stable across languages so quoted lookup criteria keep their meaning.
export const cellLabels: Record<string, Localized> = {
  Month: bi('Mes', 'Month'),
  Revenue: bi('Ventas', 'Revenue'),
  Cost: bi('Costo', 'Cost'),
  Total: bi('Total', 'Total'),
  Metric: bi('Indicador', 'Metric'),
  Amount: bi('Importe', 'Amount'),
  Margin: bi('Margen', 'Margin'),
  Assumption: bi('Supuesto', 'Assumption'),
  Value: bi('Valor', 'Value'),
  Growth: bi('Crecimiento', 'Growth'),
  Scenario: bi('Escenario', 'Scenario'),
  Forecast: bi('Proyección', 'Forecast'),
  Product: bi('Producto', 'Product'),
  Units: bi('Unidades', 'Units'),
  Price: bi('Precio', 'Price'),
  Result: bi('Resultado', 'Result'),
  Average: bi('Promedio', 'Average'),
  Team: bi('Centro', 'Team'),
  Budget: bi('Presupuesto', 'Budget'),
  Actual: bi('Real', 'Actual'),
  Status: bi('Estado', 'Status'),
  Ratio: bi('Ratio', 'Ratio'),
  Request: bi('Solicitud', 'Request'),
  Approved: bi('Aprobado', 'Approved'),
  Invoice: bi('Factura', 'Invoice'),
  Count: bi('Conteo', 'Count'),
  Code: bi('Código', 'Code'),
  Recorded: bi('Registrado', 'Recorded'),
  Raw: bi('Original', 'Raw'),
  Clean: bi('Limpio', 'Clean'),
  Number: bi('Número', 'Number'),
  Period: bi('Periodo', 'Period'),
  Year: bi('Año', 'Year'),
  Close: bi('Cierre', 'Close'),
  'Due date': bi('Vencimiento', 'Due date'),
  'Days overdue': bi('Días vencidos', 'Days overdue'),
  Cutoff: bi('Corte', 'Cutoff'),
  Principal: bi('Capital', 'Principal'),
  'Annual rate': bi('Tasa anual', 'Annual rate'),
  Months: bi('Meses', 'Months'),
  Payment: bi('Cuota', 'Payment'),
  'Future value': bi('Valor futuro', 'Future value'),
  Years: bi('Años', 'Years'),
  'Present value': bi('Valor presente', 'Present value'),
  Rate: bi('Tasa', 'Rate'),
  'Cash flow': bi('Flujo de caja', 'Cash flow'),
  NPV: bi('VAN', 'NPV'),
  IRR: bi('TIR', 'IRR'),
  'Hurdle rate': bi('Tasa mínima', 'Hurdle rate'),
  Variance: bi('Desviación', 'Variance'),
  'Variance %': bi('Desviación %', 'Variance %'),
  Receipts: bi('Cobros', 'Receipts'),
  Payments: bi('Pagos', 'Payments'),
  'Net flow': bi('Flujo neto', 'Net flow'),
  Balance: bi('Saldo', 'Balance'),
  'Opening balance': bi('Saldo inicial', 'Opening balance'),
  'Minimum balance': bi('Saldo mínimo', 'Minimum balance'),
};
