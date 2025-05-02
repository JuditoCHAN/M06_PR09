import { Server } from 'mock-socket';

// se crea una instancia del servidor mock
const mockServer = new Server('ws://localhost:1234');

// servidor mock escucha eventos de conexión
// cada vez que un cliente se conecta, se ejecuta el callback (al que se le pasa el socket)
// el socket es el canal de comunicación entre el cliente y el servidor mock
mockServer.on('connection', socket => {
  socket.on('message', data => { // El servidor escucha mensajes enviados por el cliente a través del evento message
    const mensaje = JSON.parse(data.toString()); // el mensaje recibido data se convierte a string y luego a objeto

    if (mensaje.contenido === 'expulsion') {
      socket.send(JSON.stringify({ tipo: 'expulsion' }));
      socket.close();
    } else {
      socket.send(JSON.stringify({ tipo: 'mensaje', ...mensaje }));
    }
  });
});

export default mockServer;
