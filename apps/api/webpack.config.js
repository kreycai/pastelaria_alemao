const nodeExternals = require("webpack-node-externals");

module.exports = (options) => {
  // Encontra a regra do ts-loader e ativa transpileOnly para evitar conflito de rootDir
  const rules = (options.module?.rules ?? []).map((rule) => {
    if (rule.use && Array.isArray(rule.use)) {
      return {
        ...rule,
        use: rule.use.map((u) =>
          u.loader === "ts-loader"
            ? { ...u, options: { ...u.options, transpileOnly: true } }
            : u,
        ),
      };
    }
    return rule;
  });

  return {
    ...options,
    module: { ...options.module, rules },
    externals: [
      nodeExternals({
        allowlist: [/^@pastelaria\//],
      }),
    ],
  };
};
