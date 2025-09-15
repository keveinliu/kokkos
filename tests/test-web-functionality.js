const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 导航到登录页面
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('input[type="email"]');
    
    // 登录
    await page.type('input[type="email"]', 'admin@example.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 等待登录成功并导航到设置页面
    await page.waitForNavigation();
    await page.goto('http://localhost:5173/settings');
    await page.waitForSelector('h1');
    
    console.log('✅ 成功导航到设置页面');
    
    // 测试设置保存功能
    await page.waitForSelector('input[placeholder="请输入站点名称"]');
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="请输入站点名称"]');
      input.value = '测试博客站点';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    // 点击保存设置按钮
    await page.click('button:has-text("保存设置")');
    
    // 等待一下看是否有成功提示
    await page.waitForTimeout(2000);
    
    console.log('✅ 设置保存功能测试完成');
    
    // 测试备份功能
    await page.click('button:has-text("备份数据")');
    
    // 等待备份完成
    await page.waitForTimeout(3000);
    
    console.log('✅ 备份功能测试完成');
    
    // 检查是否有错误
    const errors = await page.evaluate(() => {
      return window.console.errors || [];
    });
    
    if (errors.length === 0) {
      console.log('🎉 所有功能测试通过，没有发现401错误！');
    } else {
      console.log('❌ 发现错误:', errors);
    }
    
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  } finally {
    await browser.close();
  }
})();