import axios from 'axios';

const endpoint = `https://elb.soyclickstore.com/api/v1`;
// const endpoint = `http://localhost:8000/api/v1`;

export default class ClicstoreBackendService {

    private static _instance: ClicstoreBackendService;

    constructor() {  }

    // Singleton
    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    get headers() {
        return {
            headers: { 'Content-Type': 'application/json' }
        }
    }

    confirmPedido(phone: any, data?: string) {
        return axios.put(`${endpoint}/pedidos/bot-confirm/${phone}`, { data }, this.headers)
    }

}
