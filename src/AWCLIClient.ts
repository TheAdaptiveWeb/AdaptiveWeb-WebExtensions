
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
                console.log('Removing old development adapters');
                let devAdapters = client.getAdapters();
                let uninstallList = Object.keys(devAdapters).filter(k => devAdapters[k].developer);
                uninstallList.forEach((adapter: any) => client.detachAdapter(adapter.id));
    
                console.log('Adding adapters:', adapters);
                adapters.forEach(adapter => {
                    adapter.developer = true;
                    let a = Adapter.fromObject(adapter);
                    client.attachAdapter(a, true);
                    a.execute(client.getAdapterContext(a));
                });
            });
        });
        
        this.socket.on('adapterUpdate', ((msg: any) => {
            console.log('Adapter update from awcli:', msg);
            
            // Install the adapter
            msg.developer = true;
            let adapter = Adapter.fromObject(msg);
            client.attachAdapter(adapter, true);

            if (autoReload) {
                location.reload();
            }
        }));
    }

}