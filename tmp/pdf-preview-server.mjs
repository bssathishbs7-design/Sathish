import {createServer} from 'vite';
const server=await createServer({server:{host:'127.0.0.1',port:5199,strictPort:true,watch:{ignored:['**/tmp/**','**/docs/**','**/dist/**']}}});await server.listen();
