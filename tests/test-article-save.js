// 测试文章保存功能
const API_BASE_URL = 'http://localhost:3001/api';

// 模拟前端发送的数据格式
const testArticleData = {
  title: '测试文章编辑保存',
  content: '这是测试内容',
  excerpt: '测试摘要',
  category_id: 1,
  tag_ids: [1, 2], // 前端发送的是 tag_ids
  status: 'published'
};

// 测试创建文章
async function testCreateArticle() {
  try {
    console.log('测试创建文章...');
    console.log('发送数据:', JSON.stringify(testArticleData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testArticleData),
    });
    
    console.log('响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('创建失败:', errorText);
      return null;
    }
    
    const result = await response.json();
    console.log('创建成功:', result);
    return result;
  } catch (error) {
    console.error('请求错误:', error);
    return null;
  }
}

// 测试更新文章
async function testUpdateArticle(articleId) {
  try {
    console.log('\n测试更新文章...');
    const updateData = {
      ...testArticleData,
      title: '测试文章编辑保存 - 已更新',
      content: '这是更新后的内容'
    };
    
    console.log('发送数据:', JSON.stringify(updateData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    console.log('响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('更新失败:', errorText);
      return false;
    }
    
    const result = await response.json();
    console.log('更新成功:', result);
    return true;
  } catch (error) {
    console.error('请求错误:', error);
    return false;
  }
}

// 测试创建新标签
async function testCreateTag() {
  try {
    console.log('\n测试创建新标签...');
    const tagData = {
      name: '测试标签',
      description: '这是一个测试标签',
      color: '#FF5733'
    };
    
    console.log('发送数据:', JSON.stringify(tagData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tagData),
    });
    
    console.log('响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('创建标签失败:', errorText);
      return null;
    }
    
    const result = await response.json();
    console.log('创建标签成功:', result);
    return result;
  } catch (error) {
    console.error('请求错误:', error);
    return null;
  }
}

// 运行测试
async function runTests() {
  console.log('开始测试文章保存功能...');
  
  // 测试创建标签
  await testCreateTag();
  
  // 测试创建文章
  const createdArticle = await testCreateArticle();
  
  if (createdArticle && createdArticle.data && createdArticle.data.id) {
    // 测试更新
    await testUpdateArticle(createdArticle.data.id);
  }
  
  console.log('\n测试完成');
}

runTests();