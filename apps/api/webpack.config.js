const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/api'),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      tsPlugins: [
        {
          name: '@nestjs/swagger/plugin',
          options: {
            dtoFileNameSuffix: ['.entity.ts', '.dto.ts'],
            controllerFileNameSuffix: ['.controller.ts'],
            classValidatorShim: true,
            dtoKeyOfComment: 'description',
            controllerKeyOfComment: 'description',
            introspectComments: true,
          },
        },
      ],
    }),
  ],
};
