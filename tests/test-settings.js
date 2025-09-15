// 测试设置保存和备份功能
const testSettings = async () => {
  const baseUrl = 'http://localhost:3001/api';
  let token;
  
  // 模拟登录获取token
  console.log('🔐 测试登录...');
  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  
  if (loginResponse.ok) {
    const loginData = await loginResponse.json();
    token = loginData.data.token;
    console.log('✅ 登录成功，获取到token');
    console.log('🔍 Token内容:', token.substring(0, 50) + '...');
    
    // 解码token查看内容
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log('🔍 Token payload:', JSON.stringify(payload, null, 2));
    } catch (e) {
      console.log('❌ 无法解码token:', e.message);
    }
  } else {
    const errorData = await loginResponse.json();
    console.log('❌ 登录失败:', loginResponse.status, JSON.stringify(errorData));
    return;
  }
  
  // 测试设置保存
  console.log('💾 测试设置保存...');
  const settingsData = {
    settings: {
      site_name: { value: '测试博客' },
      site_description: { value: '这是一个测试描述' },
      author_name: { value: '测试作者' },
      author_bio: { value: '测试简介' }
    }
  };
  
  const saveResponse = await fetch(`${baseUrl}/settings/batch-update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(settingsData)
  });
  
  if (saveResponse.ok) {
    console.log('✅ 设置保存成功');
  } else {
    console.error('❌ 设置保存失败:', saveResponse.status, await saveResponse.text());
  }
  
  // 测试备份功能
  console.log('📦 测试备份功能...');
  const backupResponse = await fetch(`${baseUrl}/settings/backup`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (backupResponse.ok) {
    console.log('✅ 备份功能正常');
  } else {
    console.error('❌ 备份功能失败:', backupResponse.status, await backupResponse.text());
  }
  
  console.log('🎉 所有测试完成！');
};

testSettings().catch(console.error);