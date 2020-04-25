const getShaderPath = (path) => {
  const { url } = import.meta;
  const directoryPath = url.substring(0, url.lastIndexOf('/') + 1);
  return directoryPath + path.replace(/^\.\//, '');
}

export const loadShader = (path) => fetch(getShaderPath(path)).then(r => r.text());
