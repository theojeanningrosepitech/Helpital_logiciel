const express = require('express');
var path = require('path');

const app = express();

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Helpital API',
    version: '1.0.0',
  },
};

const options = {
  swaggerDefinition,
  apis: [__dirname + '/../server/api/*/*.js', __dirname + '/../routes/*/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);


app.use(express.static(path.join(__dirname, 'docs')));
app.use('/web-api', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/misc', function (req, res, next) {
  res.sendFile(path.join(__dirname, 'docs/index.html'));
})

app.listen(3001);
console.log('Documentation can be found either on http://localhost:3001/misc or on http://localhost:3001/web-api for API documentation');