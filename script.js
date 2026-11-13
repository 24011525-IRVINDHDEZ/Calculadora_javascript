/* =========================================================
   Calculadora básica - Reto 4
   Programación web del lado del cliente (UVEG)
   Autor: Irvin Daniel Hernández Márquez
   ========================================================= */

// ----- 1. Referencias a elementos del DOM -----
const pantalla = document.getElementById("pantalla");
const textoResultado = document.getElementById("resultado");
const textoOperacion = document.getElementById("operacion");
const teclado = document.getElementById("teclado");

// ----- 2. Estado de la calculadora -----
const MAX_DIGITOS = 15;
const SIMBOLOS = { "+": "+", "-": "−", "*": "×", "/": "÷" };

const estado = {
  actual: "0",           // número que se está escribiendo (texto)
  previo: null,          // primer operando ya guardado (número)
  operador: null,        // operación pendiente: + - * /
  esperandoNuevo: false, // true = el siguiente dígito inicia un número nuevo
  operacion: "",         // texto auxiliar, p. ej. "12 + 3 ="
  error: false           // true = se muestra un mensaje de error
};

// ----- 3. Funciones de cálculo -----
// Corrige errores de punto flotante (0.1 + 0.2 = 0.30000000000000004)
function redondear(numero) {
  return parseFloat(numero.toPrecision(12));
}

function operar(a, b, operador) {
  switch (operador) {
    case "+": return redondear(a + b);
    case "-": return redondear(a - b);
    case "*": return redondear(a * b);
    case "/": return b === 0 ? null : redondear(a / b); // null = error
    default:  return b;
  }
}

// Da formato a un número para que quepa en la pantalla
function formatear(numero) {
  const absoluto = Math.abs(numero);
  if (absoluto >= 1e12 || (absoluto > 0 && absoluto < 1e-9)) {
    return numero.toExponential(6);
  }
  return String(numero);
}

// ----- 4. Acciones de los botones -----
function ingresarNumero(digito) {
  if (estado.error) limpiar();
  if (estado.esperandoNuevo) {
    if (!estado.operador) estado.operacion = ""; // nueva operación tras "="
    estado.actual = digito;
    estado.esperandoNuevo = false;
  } else if (estado.actual === "0") {
    estado.actual = digito;
  } else if (estado.actual.replace(/[-.]/g, "").length < MAX_DIGITOS) {
    estado.actual += digito;
  }
}

function ingresarPunto() {
  if (estado.error) limpiar();
  if (estado.esperandoNuevo) {
    if (!estado.operador) estado.operacion = "";
    estado.actual = "0.";
    estado.esperandoNuevo = false;
  } else if (!estado.actual.includes(".")) {
    estado.actual += ".";  // solo se permite un punto por número
  }
}

function elegirOperador(nuevoOperador) {
  if (estado.error) return;
  const valor = parseFloat(estado.actual);

  if (estado.operador && !estado.esperandoNuevo) {
    // Operaciones encadenadas: 5 + 3 × ... resuelve primero 5 + 3
    const parcial = operar(estado.previo, valor, estado.operador);
    if (parcial === null) return mostrarError("No se puede dividir entre 0");
    estado.previo = parcial;
    estado.actual = formatear(parcial);
  } else if (!estado.operador) {
    estado.previo = valor;
  }
  // Si ya había operador y no se escribió número, solo se reemplaza
  estado.operador = nuevoOperador;
  estado.esperandoNuevo = true;
  estado.operacion = `${formatear(estado.previo)} ${SIMBOLOS[nuevoOperador]}`;
}

function calcular() {
  if (estado.error || estado.operador === null) return;
  const a = estado.previo;
  const b = parseFloat(estado.actual);
  const resultado = operar(a, b, estado.operador);

  if (resultado === null) return mostrarError("No se puede dividir entre 0");

  estado.operacion = `${formatear(a)} ${SIMBOLOS[estado.operador]} ${formatear(b)} =`;
  estado.actual = formatear(resultado);
  estado.previo = null;
  estado.operador = null;
  estado.esperandoNuevo = true;
}

function limpiar() {
  estado.actual = "0";
  estado.previo = null;
  estado.operador = null;
  estado.esperandoNuevo = false;
  estado.operacion = "";
  estado.error = false;
}

function borrar() {
  if (estado.error) return limpiar();
  if (estado.esperandoNuevo) return; // no se borra un resultado
  estado.actual = estado.actual.length > 1 ? estado.actual.slice(0, -1) : "0";
  if (estado.actual === "-") estado.actual = "0";
}

function cambiarSigno() {
  if (estado.error || estado.actual === "0") return;
  if (estado.esperandoNuevo && estado.operador) return;
  estado.actual = estado.actual.startsWith("-")
    ? estado.actual.slice(1)
    : "-" + estado.actual;
}

function mostrarError(mensaje) {
  limpiar();
  estado.error = true;
  estado.actual = mensaje;
}

// ----- 5. Actualizar la interfaz -----
function actualizarPantalla() {
  textoResultado.textContent = estado.actual;
  textoOperacion.textContent = estado.operacion;
  pantalla.classList.toggle("pantalla--error", estado.error);

  // Resalta el operador que está esperando el segundo número
  document.querySelectorAll(".boton--operador").forEach((boton) => {
    const activo = estado.esperandoNuevo && boton.dataset.valor === estado.operador;
    boton.classList.toggle("activo", activo);
  });
}

function ejecutarAccion(accion, valor) {
  switch (accion) {
    case "numero":    ingresarNumero(valor); break;
    case "punto":     ingresarPunto(); break;
    case "operador":  elegirOperador(valor); break;
    case "resultado": calcular(); break;
    case "limpiar":   limpiar(); break;
    case "borrar":    borrar(); break;
    case "signo":     cambiarSigno(); break;
  }
  actualizarPantalla();
}

// ----- 6. Eventos: clic (delegación) y teclado -----
teclado.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button");
  if (!boton) return;
  ejecutarAccion(boton.dataset.accion, boton.dataset.valor);
});

const TECLAS = {
  Enter: ["resultado"], "=": ["resultado"],
  Escape: ["limpiar"], Delete: ["limpiar"],
  Backspace: ["borrar"], ".": ["punto"], ",": ["punto"],
  "+": ["operador", "+"], "-": ["operador", "-"],
  "*": ["operador", "*"], "/": ["operador", "/"]
};

document.addEventListener("keydown", (evento) => {
  let accion = TECLAS[evento.key];
  if (/^[0-9]$/.test(evento.key)) accion = ["numero", evento.key];
  if (!accion) return;

  evento.preventDefault(); // evita que "/" abra la búsqueda del navegador
  ejecutarAccion(accion[0], accion[1]);
  animarBoton(accion[0], accion[1]);
});

// Efecto visual: el botón se "hunde" al usar el teclado físico
function animarBoton(accion, valor) {
  const selector = valor !== undefined
    ? `[data-accion="${accion}"][data-valor="${valor}"]`
    : `[data-accion="${accion}"]`;
  const boton = teclado.querySelector(selector);
  if (!boton) return;
  boton.classList.add("presionado");
  setTimeout(() => boton.classList.remove("presionado"), 120);
}

actualizarPantalla();
