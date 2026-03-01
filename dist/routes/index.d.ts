/**
 * 路由配置 - API 端点定义
 */
export interface Route {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    handler: (params: any) => any | Promise<any>;
    description: string;
}
export declare const routes: Route[];
/**
 * 路由匹配器
 */
export declare function matchRoute(method: string, path: string): {
    route: Route;
    params: any;
} | null;
