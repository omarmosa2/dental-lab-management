import type { WebpackPluginInstance } from 'webpack';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

export const plugins: WebpackPluginInstance[] = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
  }),
  new CopyWebpackPlugin({
    patterns: [
      {
        from: 'assets',
        to: 'assets',
      },
    ],
  }),
];