const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Servir la interfaz web
app.use(express.static(path.join(__dirname)));

let jugadores = [];
let indiceActual = 0;
let enJuego = false;

// 20 PREGUNTAS SOBRE MODALIDADES DE EXPORTACIÓN (NORMATIVA ADUANERA)
const preguntasOriginales = [
  "¿En qué consiste la Exportación Definitiva de mercancías?",
  "Menciona 3 productos que estén prohibidos exportar como Muestras sin Valor Comercial.",
  "¿Cuál es el monto límite anual FOB permitido para exportar Muestras sin Valor Comercial?",
  "¿En qué consiste la Exportación Temporal para Reimportación en el Mismo Estado?",
  "¿Cuál es el plazo máximo de permanencia autorizado para la Reimportación en el Mismo Estado y cuánto puede prorrogarse?",
  "¿Qué es la Exportación Temporal para Perfeccionamiento Pasivo y cuál es su objetivo principal?",
  "¿Cuál es el plazo máximo inicial y la prórroga máxima para el Perfeccionamiento Pasivo en el exterior?",
  "¿Cuáles son las 4 formas de finalizar la Exportación Temporal para Perfeccionamiento Pasivo?",
  "¿En qué consiste la modalidad de Exportación de Menaje de Casa?",
  "¿Qué plazo se tiene para presentar la Solicitud de Autorización de Embarque del Menaje de Casa antes o después de salir del país?",
  "¿Cuáles son los límites de valor (en USD) y peso máximo permitidos en el régimen de Tráfico Postal?",
  "Menciona los 3 documentos soporte obligatorios que el Operador Postal debe conservar por 5 años.",
  "¿Qué documentos impresos o correspondencia pueden embarcarse únicamente con el Manifiesto de Tráfico Postal sin hacer Solicitud de Autorización de Embarque?",
  "¿Qué requisito deben cumplir los bienes del Patrimonio Cultural de la Nación para ser exportados temporalmente por un viajero?",
  "¿En qué consiste el régimen de Envíos de Entrega Rápida o Mensajería Expresa?",
  "Menciona 3 de los 4 documentos soporte obligatorios para la Solicitud de Autorización de Embarque en Mensajería Expresa.",
  "¿Qué trámite debe realizar un viajero ante la aduana a su salida si desea reimportar sus mercancías sin pagar tributos?",
  "¿Cuáles son las fechas límite permitidas para enviar el equipaje no acompañado de un viajero (antes y después del viaje)?",
  "Menciona 3 de los 5 Documentos Soporte generales requeridos antes de presentar la Solicitud de Autorización de Embarque (SAE).",
  "Menciona las 3 formas en que puede finalizar el régimen de Exportación Temporal para Reimportación en el Mismo Estado."
];

// Arreglo dinámico para agotar y reiniciar las preguntas
let preguntasDisponibles = [...preguntasOriginales];

io.on('connection', (socket) => {
  console.log('Jugador conectado:', socket.id);

  socket.on('unirse', (nombre) => {
    jugadores.push({ id: socket.id, nombre });
    io.emit('actualizarJugadores', jugadores);
  });

  socket.on('iniciarJuego', () => {
    if (jugadores.length < 2 || enJuego) return;
    enJuego = true;
    indiceActual = 0;

    // Tiempo aleatorio de la ronda entre 10 y 25 segundos
    const tiempoTango = Math.floor(Math.random() * 15000) + 10000;

    const intervaloTingo = setInterval(() => {
      indiceActual = (indiceActual + 1) % jugadores.length;
      io.emit('estadoPelota', { poseedor: jugadores[indiceActual] });
    }, 800);

    setTimeout(() => {
      clearInterval(intervaloTingo);
      enJuego = false;

      // Si se agotan las preguntas, se reinicia la lista completa
      if (preguntasDisponibles.length === 0) {
        preguntasDisponibles = [...preguntasOriginales];
      }

      // Selecciona una pregunta al azar y la remueve para no repetirla
      const indicePregunta = Math.floor(Math.random() * preguntasDisponibles.length);
      const preguntaElegida = preguntasDisponibles.splice(indicePregunta, 1)[0];

      io.emit('tangoFinal', {
        perdedor: jugadores[indiceActual],
        penitencia: preguntaElegida
      });
    }, tiempoTango);
  });

  socket.on('disconnect', () => {
    jugadores = jugadores.filter(j => j.id !== socket.id);
    io.emit('actualizarJugadores', jugadores);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
