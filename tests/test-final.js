import fetch from 'node-fetch';

async function testFinalFunctionality() {
  const baseUrl = 'http://localhost:3001/api';
  let token;

  try {
    // 1. 登录获取token
    console.log('🔐 测试登录...');
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`登录失败: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    token = loginData.data.token;
    console.log('✅ 登录成功');
    console.log('Token前缀:', token.substring(0, 20) + '...');

    // 2. 测试设置保存功能
    console.log('💾 测试设置保存功能...');
    const settingsResponse = await fetch(`${baseUrl}/settings/batch-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        settings: {
          site_name: { value: '测试博客站点', description: '站点名称' },
          site_description: { value: '这是一个测试描述', description: '站点描述' }
        }
      })
    });

    if (settingsResponse.ok) {
      console.log('✅ 设置保存功能正常');
    } else {
      console.log(`❌ 设置保存失败: ${settingsResponse.status}`);
      const errorText = await settingsResponse.text();
      console.log('错误详情:', errorText);
    }

    // 3. 测试备份功能
    console.log('📦 测试备份功能...');
    const backupResponse = await fetch(`${baseUrl}/settings/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ include_images: false })
    });

    if (backupResponse.ok) {
      console.log('✅ 备份功能正常');
    } else {
      console.log(`❌ 备份失败: ${backupResponse.status}`);
      const errorText = await backupResponse.text();
      console.log('错误详情:', errorText);
    }

    console.log('\n🎉 所有API测试完成！');
    console.log('现在可以在Web页面 http://localhost:5173/settings 上测试功能了');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  }
}

testFinalFunctionality();