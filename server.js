import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(cors());
app.use(express.json());

if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
} else {
  app.use(express.static(__dirname));
}

const DATA_FILE = path.join(__dirname, 'data', 'records.json');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function readRecords() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('读取记录失败:', err);
    return [];
  }
}

function writeRecords(records) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
    return true;
  } catch (err) {
    console.error('写入记录失败:', err);
    return false;
  }
}

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '光合作用光反应模拟系统 API',
      version: '2.0.0',
      description: '用于管理和查询光合作用实验记录的API接口',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '开发服务器'
      }
    ],
    tags: [
      {
        name: 'Records',
        description: '实验记录管理'
      },
      {
        name: 'Statistics',
        description: '统计数据查询'
      }
    ],
    components: {
      schemas: {
        Record: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '记录唯一标识'
            },
            lightIntensity: {
              type: 'integer',
              description: '光强度 (0-100%)',
              minimum: 0,
              maximum: 100
            },
            wavelength: {
              type: 'integer',
              description: '波长 (380-750nm)',
              minimum: 380,
              maximum: 750
            },
            oxygenCount: {
              type: 'integer',
              description: '氧气分子数量',
              minimum: 0
            },
            atpCount: {
              type: 'integer',
              description: 'ATP分子数量',
              minimum: 0
            },
            electronRate: {
              type: 'integer',
              description: '电子传递速率',
              minimum: 0
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: '记录创建时间'
            },
            formattedTime: {
              type: 'string',
              description: '格式化的本地时间'
            }
          },
          required: ['lightIntensity', 'wavelength']
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string'
            },
            data: {
              $ref: '#/components/schemas/Record'
            }
          }
        }
      }
    }
  },
  apis: ['./server.js']
};

const specs = swaggerJsdoc(swaggerOptions);

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: '光合作用模拟系统 API文档'
  })
);

/**
 * @openapi
 * /api/records:
 *   get:
 *     summary: 获取所有实验记录
 *     tags: [Records]
 *     responses:
 *       200:
 *         description: 成功获取记录列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Record'
 *                 count:
 *                   type: integer
 *                   description: 记录总数
 */
app.get('/api/records', (req, res) => {
  const records = readRecords();
  res.json({
    success: true,
    data: records,
    count: records.length
  });
});

/**
 * @openapi
 * /api/records:
 *   post:
 *     summary: 创建新的实验记录
 *     tags: [Records]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lightIntensity:
 *                 type: integer
 *                 description: 光强度 (0-100%)
 *                 minimum: 0
 *                 maximum: 100
 *               wavelength:
 *                 type: integer
 *                 description: 波长 (380-750nm)
 *                 minimum: 380
 *                 maximum: 750
 *               oxygenCount:
 *                 type: integer
 *                 description: 氧气分子数量
 *                 minimum: 0
 *               atpCount:
 *                 type: integer
 *                 description: ATP分子数量
 *                 minimum: 0
 *               electronRate:
 *                 type: integer
 *                 description: 电子传递速率
 *                 minimum: 0
 *             required:
 *               - lightIntensity
 *               - wavelength
 *     responses:
 *       200:
 *         description: 记录保存成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 参数验证失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/records', (req, res) => {
  const { lightIntensity, wavelength, oxygenCount, atpCount, electronRate } = req.body;

  if (lightIntensity === undefined || wavelength === undefined) {
    return res.status(400).json({
      success: false,
      message: '缺少必要参数: lightIntensity 和 wavelength 为必填项'
    });
  }

  const lightIntensityNum = parseInt(lightIntensity);
  const wavelengthNum = parseInt(wavelength);

  if (isNaN(lightIntensityNum) || isNaN(wavelengthNum)) {
    return res.status(400).json({
      success: false,
      message: '参数类型错误: lightIntensity 和 wavelength 必须为数字'
    });
  }

  if (lightIntensityNum < 0 || lightIntensityNum > 100) {
    return res.status(400).json({
      success: false,
      message: '光强必须在0-100之间'
    });
  }

  if (wavelengthNum < 380 || wavelengthNum > 750) {
    return res.status(400).json({
      success: false,
      message: '波长必须在380-750nm之间'
    });
  }

  const oxygenCountNum = Math.max(0, parseInt(oxygenCount) || 0);
  const atpCountNum = Math.max(0, parseInt(atpCount) || 0);
  const electronRateNum = Math.max(0, parseInt(electronRate) || 0);

  const newRecord = {
    id: Date.now(),
    lightIntensity: lightIntensityNum,
    wavelength: wavelengthNum,
    oxygenCount: oxygenCountNum,
    atpCount: atpCountNum,
    electronRate: electronRateNum,
    timestamp: new Date().toISOString(),
    formattedTime: new Date().toLocaleString('zh-CN')
  };

  const records = readRecords();
  records.unshift(newRecord);

  if (records.length > 100) {
    records.splice(100);
  }

  if (writeRecords(records)) {
    res.json({
      success: true,
      message: '记录保存成功',
      data: newRecord
    });
  } else {
    res.status(500).json({
      success: false,
      message: '保存失败: 文件写入错误'
    });
  }
});

/**
 * @openapi
 * /api/records/{id}:
 *   delete:
 *     summary: 删除指定实验记录
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 记录ID
 *     responses:
 *       200:
 *         description: 记录删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       404:
 *         description: 记录不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 */
app.delete('/api/records/:id', (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: '无效的记录ID'
    });
  }

  let records = readRecords();

  const initialLength = records.length;
  records = records.filter(r => r.id !== id);

  if (records.length === initialLength) {
    return res.status(404).json({
      success: false,
      message: '记录不存在'
    });
  }

  if (writeRecords(records)) {
    res.json({
      success: true,
      message: '记录删除成功'
    });
  } else {
    res.status(500).json({
      success: false,
      message: '删除失败: 文件写入错误'
    });
  }
});

/**
 * @openapi
 * /api/stats:
 *   get:
 *     summary: 获取实验统计数据
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: 成功获取统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalRecords:
 *                   type: integer
 *                   description: 总记录数
 *                 avgOxygen:
 *                   type: number
 *                   description: 平均氧气产量
 *                 avgAtp:
 *                   type: number
 *                   description: 平均ATP产量
 *                 avgRate:
 *                   type: number
 *                   description: 平均电子传递速率
 *                 maxRate:
 *                   type: number
 *                   description: 最高电子传递速率
 */
app.get('/api/stats', (req, res) => {
  const records = readRecords();

  if (records.length === 0) {
    return res.json({
      success: true,
      totalRecords: 0,
      avgOxygen: 0,
      avgAtp: 0,
      avgRate: 0,
      maxRate: 0
    });
  }

  const totalOxygen = records.reduce((sum, r) => sum + r.oxygenCount, 0);
  const totalAtp = records.reduce((sum, r) => sum + r.atpCount, 0);
  const totalRate = records.reduce((sum, r) => sum + r.electronRate, 0);

  res.json({
    success: true,
    totalRecords: records.length,
    avgOxygen: parseFloat((totalOxygen / records.length).toFixed(2)),
    avgAtp: parseFloat((totalAtp / records.length).toFixed(2)),
    avgRate: parseFloat((totalRate / records.length).toFixed(2)),
    maxRate: Math.max(...records.map(r => r.electronRate))
  });
});

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: 健康检查
 *     tags: [System]
 *     responses:
 *       200:
 *         description: 服务正常运行
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

if (NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║            光合作用光反应模拟系统 v2.0                              ║
╠═══════════════════════════════════════════════════════════════════╣
║  环境: ${NODE_ENV.padEnd(55)}║
║  服务器端口: ${PORT.toString().padEnd(50)}║
╠═══════════════════════════════════════════════════════════════════╣
║  🌐 访问地址:                                                       ║
║     主页:      http://localhost:${PORT.toString().padEnd(37)}║
║     API文档:   http://localhost:${PORT}/api-docs${' '.padEnd(32)}║
╠═══════════════════════════════════════════════════════════════════╣
║  📡 API 接口:                                                       ║
║     GET    /api/health      - 健康检查                            ║
║     GET    /api/records     - 获取所有记录                        ║
║     POST   /api/records     - 保存新记录                          ║
║     DELETE /api/records/:id - 删除记录                            ║
║     GET    /api/stats       - 获取统计数据                        ║
╚═══════════════════════════════════════════════════════════════════╝
  `);
});
