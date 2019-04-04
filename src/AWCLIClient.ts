
import * as io from 'socket.io-client';
import { AWClient, Adapter } from 'adaptiveweb';

/**
 * Handles interactions between the developer mode client
 */
export class AWCLIClient {

    socket: SocketIOClient.Socket;
    client: AWClient;
    autoReload: boolean;

    constructor(client: AWClient, autoReload: boolean = false) {
        this.client = client;
        this.socket = io('http://localhost:13551');
        this.autoReload = autoReload;

        this.socket.io.on('connect_error', (err: any) => {
            console.log('Development server not online.', err);
            this.socket.close();
            return;
        });

        this.socket.on('connect', () => { 
            console.log('Connected to development server');
            this.socket.emit('requestAdapters', (adapters: any[]) => {
                console.log('Adding developer adapters:', adapters);
                adapters.forEach(adapter => {
                    let a = Adapter.fromObject(adapter);
                    a.execute(client.getAdapterContext(a));
                });

                window.postMessage({ message: 'incomingDeveloperAdapters', data: adapters }, '*')
            });
        });
        
        this.socket.on('adapterUpdate', ((msg: any) => {
            console.log('Adapter update from awcli:', msg);
            
            if (autoReload) {
                location.reload();
            }
        }));
    }

}