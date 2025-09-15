const http = require('http');

// 测试API创建文章并关联标签
async function testApiTags() {
  console.log('🧪 测试API标签关联功能...');
  
  // 测试数据
  const testArticle = {
    title: 'API测试文章',
    content: '这是通过API创建的测试文章',
    excerpt: 'API测试摘要',
    status: 'draft',
    tag_ids: [1, 2] // 关联标签ID 1和2
  };
  
  const postData = JSON.stringify(testArticle);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/articles',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`响应状态码: ${res.statusCode}`);
        console.log('响应数据:', data);
        
        if (res.statusCode === 201) {
          console.log('✅ 文章创建成功');
          resolve(JSON.parse(data));
        } else {
          console.log('❌ 文章创建失败');
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('❌ 请求错误:', err);
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

// 获取文章详情并检查标签关联
async function getArticleWithTags(articleId) {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/articles/${articleId}`,
    method: 'GET'
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`获取文章响应状态码: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          const article = JSON.parse(data);
          console.log('📄 文章详情:');
          console.log(`  标题: ${article.title}`);
          console.log(`  状态: ${article.status}`);
          console.log(`  标签数量: ${article.tags ? article.tags.length : 0}`);
          
          if (article.tags && article.tags.length > 0) {
            console.log('  关联标签:');
            article.tags.forEach(tag => {
              console.log(`    - ${tag.name} (ID: ${tag.id}, 颜色: ${tag.color})`);
            });
          } else {
            console.log('  ❌ 没有关联的标签');
          }
          
          resolve(article);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

// 主测试函数
async function runTest() {
  try {
    // 1. 创建文章
    const createdArticle = await testApiTags();
    
    // 2. 获取文章详情检查标签
    if (createdArticle && createdArticle.id) {
      console.log('\n🔍 检查创建的文章标签关联...');
      await getArticleWithTags(createdArticle.id);
    }
    
    console.log('\n✅ API标签关联测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

runTest();