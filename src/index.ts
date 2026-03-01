/**
 * 金币交易协议 - 主入口
 * 
 * 使用 Bun 运行时的 RESTful API 服务
 */

import { matchRoute, routes } from './routes';
import { rateLimitMiddleware, addRateLimitHeaders, RateLimitResult } from './middleware/rate-limit.middleware';

const PORT = process.env.PORT || 3000;

/**
 * 创建 HTTP 服务器
 */
const server = Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;

    // CORS 处理
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-RateLimit-Type'
        }
      });
    }

    // API 限流检查
    const rateLimitCheck = rateLimitMiddleware(req);
    if (!rateLimitCheck.allowed && rateLimitCheck.response) {
      return rateLimitCheck.response;
    }
    const rateLimitResult = rateLimitCheck.result!;

    // 健康检查
    if (path === '/health') {
      const response = new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' }
      });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    // API 文档
    if (path === '/api' || path === '/api/docs') {
      const apiDocs = routes.map(r => ({
        method: r.method,
        path: r.path,
        description: r.description
      }));
      const response = new Response(JSON.stringify({ routes: apiDocs }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    // 路由匹配
    const matched = matchRoute(method, path);

    if (!matched) {
      const response = new Response(JSON.stringify({
        success: false,
        error: 'Not Found',
        path,
        method
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

      // 添加限流响应头
      return addRateLimitHeaders(response, rateLimitResult);
    }

    try {
      let params = { ...matched.params };

      // 合并查询参数
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      // 合并请求体（POST/PUT）
      if (method === 'POST' || method === 'PUT') {
        const contentType = req.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          try {
            const body = await req.json();
            params = { ...params, ...body };
          } catch (e) {
            // JSON 解析失败，忽略
          }
        }
      }

      // 执行处理器
      const result = await matched.route.handler(params);

      const response = new Response(JSON.stringify(result, null, 2), {
        status: result.success ? 200 : 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

      // 添加限流响应头
      return addRateLimitHeaders(response, rateLimitResult);
    } catch (error) {
      console.error('Handler error:', error);
      const response = new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

      // 添加限流响应头
      return addRateLimitHeaders(response, rateLimitResult);
    }
  }
});

console.log(`
╔════════════════════════════════════════════╗
║     🪙 金币交易协议 - Token System       ║
╠════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}   ║
║  API Docs: http://localhost:${PORT}/api/docs   ║
║  Health: http://localhost:${PORT}/health       ║
╚════════════════════════════════════════════╝
`);

console.log('核心功能:');
console.log('  ✅ 代币账户系统 - 余额查询、转账、冻结');
console.log('  ✅ 空投机制 - 创建、激活、领取空投');
console.log('  ✅ 任务奖励系统 - 创建、完成、奖励发放');
console.log('');