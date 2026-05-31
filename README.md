# 光合作用光反应模拟实验

一个交互式的生物学教学演示工具，通过Canvas动画模拟光合作用光反应过程。

## ✨ 工程化特性

### 🚀 Vite 前端构建优化
- **CSS代码分割**：自动按模块分割CSS，按需加载
- **资源哈希**：构建产物自动添加content hash，优化缓存策略
- **Rollup打包**：使用Rollup进行生产环境打包，自动tree-shaking
- **代理配置**：内置开发服务器API代理，解决跨域问题
- **资源内联优化**：小资源自动base64内联，减少请求数
- **构建报告**：gzip压缩大小统计，自动代码分割阈值警告

### 📖 Swagger API文档自动生成
- **OpenAPI 3.0规范**：完整的API文档定义
- **交互式调试**：内置Swagger UI，浏览器中直接测试API
- **Schema验证**：完整的数据模型定义和验证规则
- **自动生成**：基于代码注释自动生成文档，保持同步

## 功能特性

### 🎨 可视化模拟
- **类囊体膜结构展示**：完整的膜结构和磷脂双分子层示意
- **光系统II (PSII)**：P680反应中心，水的光解和氧气释放
- **细胞色素b₆f复合体**：电子传递和质子泵
- **光系统I (PSI)**：P700反应中心
- **ATP合酶**：化学渗透和ATP合成

### 🎮 交互控制
- **光强调节**：0-100%连续调节，影响电子传递速率
- **波长选择**：400-700nm可见光范围，模拟不同光质的效率
- **实时控制**：开始、暂停、重置模拟过程

### 📊 数据展示
- **实时统计面板**：
  - 氧气释放量 (O₂ molecules)
  - ATP产率 (ATP molecules)
  - 电子传递速率 (e⁻/s)

- **动态曲线图**：右侧实时绘制电子传递速率变化曲线
- **实验记录**：自动保存实验参数到本地存储或后端数据库

### 🔬 科学原理
- 光子吸收和激发能传递
- 电子传递链（Z-scheme）
- 水的光解产生氧气
- 质子梯度形成（类囊体腔酸化）
- ATP合酶催化ATP合成
- 不同波长光的吸收效率（红蓝光高效，绿光低效）

## 安装和运行

### 环境要求
- Node.js >= 18.0.0
- npm 或 yarn

### 开发模式（推荐）
```bash
# 1. 安装依赖
npm install

# 2. 启动前端开发服务器 + 后端API服务器 (concurrently)
npm start

# 或者分别启动
npm run dev           # 前端 (Vite, http://localhost:5173)
npm run server        # 后端 (http://localhost:3000)
```

### 生产构建
```bash
# 1. 构建前端
npm run build

# 2. 启动生产服务器
npm run start:prod
```

### 访问地址
- **前端页面**：http://localhost:5173
- **后端API**：http://localhost:3000
- **API文档**：http://localhost:3000/api-docs

## NPM脚本说明

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动Vite开发服务器 |
| `npm run build` | 生产环境构建，输出到dist目录 |
| `npm run preview` | 预览生产构建结果 |
| `npm run server` | 启动后端API服务器 |
| `npm run server:dev` | 启动后端（nodemon自动重启） |
| `npm start` | 同时启动前端和后端（开发模式） |
| `npm run start:prod` | 启动生产模式 |
| `npm test` | 运行状态机演示测试 |

## API接口文档

启动服务器后访问 **http://localhost:3000/api-docs** 查看完整的交互式API文档。

### 主要接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/records` | 获取所有实验记录 |
| POST | `/api/records` | 创建新记录（自动验证参数） |
| DELETE | `/api/records/:id` | 删除指定记录 |
| GET | `/api/stats` | 获取统计数据 |
| GET | `/api-docs` | Swagger API文档 |

### 参数验证规则
- **lightIntensity**: 0-100 (光强百分比)
- **wavelength**: 380-750 (可见光范围nm)
- **oxygenCount**: >= 0 (非负整数)
- **atpCount**: >= 0 (非负整数)
- **electronRate**: >= 0 (非负整数)

### API调用示例

#### 获取所有记录
```http
GET /api/records
```
响应：
```json
{
  "success": true,
  "data": [...],
  "count": 42
}
```

#### 保存新记录
```http
POST /api/records
Content-Type: application/json

{
  "lightIntensity": 75,
  "wavelength": 680,
  "oxygenCount": 12,
  "atpCount": 24,
  "electronRate": 35
}
```

## 项目结构
```
photosynthesis-simulation/
├── index.html              # 主页面
├── style.css               # 样式文件
├── simulation.js           # 核心模拟逻辑
├── chart.js                # 图表绘制
├── app.js                  # 应用入口
├── electron_transport_sm.js # 电子传递状态机
├── etc_animator.js         # 动画渲染器
├── server.js               # Express + Swagger API服务器
├── vite.config.js          # Vite配置
├── package.json            # 项目配置
├── .env.example            # 环境变量示例
├── state_machine_demo.js   # 状态机演示
├── extension_demo.js       # 扩展功能演示
├── 📁 data/
│   └── records.json        # 实验记录（自动创建）
├── 📁 dist/                # 构建输出（Vite）
├── 📁 tests/               # 测试文件
└── README.md               # 说明文档
```

## 架构设计

### 前端架构（Vite + ES Modules）
- **模块化设计**：全部使用ES Module，支持tree-shaking
- **代码分割**：
  - `simulation` chunk：核心模拟逻辑和状态机
  - `ui` chunk：图表绘制和UI交互
- **CSS分割**：按模块分割，按需加载
- **资源优化**：小资源自动base64内联，大资源CDN优化

### 后端架构（Express + Swagger）
- **RESTful API设计**：标准化接口，资源导向
- **参数验证**：完整的边界检查和类型校验
- **JSDoc生成文档**：`@openapi`注释自动生成Swagger UI
- **生产/开发双模式**：开发环境使用根目录，生产使用dist

### 状态机架构
```
ElectronTransportStateMachine
    ├── 状态枚举: IDLE, AT_PSII, PSII_TO_CYTO, AT_CYTO, etc.
    ├── 状态迁移: proceed() 方法驱动状态变化
    ├── 观察者模式: ETCObservable 管理事件分发
    └── 钩子机制: 状态进入/退出回调
```

## 使用说明

### 基本操作流程
1. **调节参数**：拖动滑块设置光强（0-100%）和波长（400-700nm）
2. **开始模拟**：点击"开始模拟"按钮启动动画
3. **观察现象**：
   - 光子射向光系统
   - 电子在传递链中移动
   - 氧气气泡从PSII处释放
   - 氢离子在类囊体腔中积累
   - ATP从ATP合酶产生
4. **查看数据**：观察统计面板和实时曲线变化
5. **保存记录**：点击"保存记录"保存当前实验参数
6. **对比实验**：尝试不同波长（如430nm蓝光 vs 550nm绿光），观察效率差异

### 实验建议
- **波长实验**：测试680nm（红光）、430nm（蓝光）、550nm（绿光），对比电子传递速率
- **光强实验**：分别用25%、50%、75%、100%光强，记录ATP产率
- **组合实验**：研究光强和波长的协同效应

## 技术栈
- **前端构建**：Vite 5.x + Rollup
- **前端**：原生JavaScript + Canvas 2D API
- **后端**：Node.js + Express
- **API文档**：Swagger UI + OpenAPI 3.0
- **数据存储**：本地JSON文件 + 浏览器LocalStorage
- **样式**：纯CSS3，渐变效果，响应式设计

## 浏览器兼容性
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 许可证
MIT License

## 致谢
本项目基于植物生理学经典实验设计，参考了Campbell Biology等教材的光合作用原理。
