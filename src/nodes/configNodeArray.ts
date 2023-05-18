import type ConfigNode from "./configNode";

class ConfigNodeArray {
  arrayValues: ConfigNode[];

  constructor(arrayValues: ConfigNode[]) {
    this.arrayValues = arrayValues;
  }
}

export default ConfigNodeArray;
