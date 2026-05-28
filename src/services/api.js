import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost/clickventures-api' });
export default API;