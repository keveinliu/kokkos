const http = require('http');

// 测试直接访问后端API
function testBackendAPI() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/articles',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`后端API状态码: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('后端API响应长度:', data.length);
      console.log('后端API响应前100字符:', data.substring(0, 100));
      testFrontendProxy();
    });
  });

  req.on('error', (e) => {
    console.error(`后端API请求错误: ${e.message}`);
    testFrontendProxy();
  });

  req.end();
}

// 测试前端代理
function testFrontendProxy() {
  const options = {
    hostname: 'localhost',
    port: 4173,
    path: '/api/articles',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`前端代理状态码: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('前端代理响应长度:', data.length);
      console.log('前端代理响应:', data);
    });
  });

  req.on('error', (e) => {
    console.error(`前端代理请求错误: ${e.message}`);
  });

  req.end();
}

console.log('开始测试API连接...');
testBackendAPI();