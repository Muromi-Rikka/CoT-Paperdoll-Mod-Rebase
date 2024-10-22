import { PaperDollSystem } from "./paperDollClass.ts";

interface IClothes {
  path: string;
  color?: string | null;
}

function createCanvas(id: string) {
  const canvas = document.createElement("canvas");
  canvas.id = id;
  canvas.style.position = "absolute";
  canvas.style.left = "-5px";
  canvas.style.top = "0px";
  canvas.style.transform = "scale(1.75)";
  canvas.style.transformOrigin = "top left";
  return canvas;
};

function checkImgExists(src: string) {
  return Boolean(window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src));
}

function colorConvert(color: string) {
  if (setup.color_table[color]) {
    return setup.color_table[color];
  }
  else {
    return color;
  }
}

function ifColorPush(path: string, targetArray: Array<IClothes>, color: string | null): Array<IClothes> {
  if (checkImgExists(`${path}_gray.png`)) {
    targetArray.push({ path: `${path}_gray.png`, color });
  }
  else {
    targetArray.push({ path: `${path}.png` });
  }
  return targetArray;
}

function clotheBaseSubLayers(imgPath: string, color: string | null, bodyClothes: Array<IClothes>, leftHandClothes: Array<IClothes>, rightHandClothes: Array<IClothes>) {
  bodyClothes = ifColorPush(`${imgPath}full`, bodyClothes, color);
  leftHandClothes = ifColorPush(`${imgPath}left`, leftHandClothes, color);
  rightHandClothes = ifColorPush(`${imgPath}right`, rightHandClothes, color);
  return [bodyClothes, leftHandClothes, rightHandClothes];
}

function clotheSubLayers(imgPath: string, color: string | null, bodyClothes: Array<IClothes>, leftHandClothes: Array<IClothes>, rightHandClothes: Array<IClothes>) {
  [bodyClothes, leftHandClothes, rightHandClothes] = clotheBaseSubLayers(imgPath, color, bodyClothes, leftHandClothes, rightHandClothes);
  console.log(typeof bodyClothes, typeof leftHandClothes, typeof rightHandClothes);
  bodyClothes.push({ path: `${imgPath}acc_full.png` });
  leftHandClothes.push({ path: `${imgPath}acc_left.png` });
  rightHandClothes.push({ path: `${imgPath}acc_right.png` });
  return [bodyClothes, leftHandClothes, rightHandClothes];
}
function clotheLayers(clothes: Array<any>, bodyClothes: Array<IClothes>, leftHandClothes: Array<IClothes>, rightHandClothes: Array<IClothes>) {
  for (let i = 0; i < clothes.length; i++) {
    const citem = setup.clothes[clothes[i].item];
    const imgPath = `res/clothes/${citem.category}/${clothes[i].item.replace(/ /g, "_")}/`;
    let mainColor: null | string = null;
    if (clothes[i].subs.color || clothes[i].subs.color1) {
      mainColor = (colorConvert(clothes[i].subs.color) || colorConvert(clothes[i].subs.color1)) as string;
    }
    // main
    [bodyClothes, leftHandClothes, rightHandClothes] = clotheSubLayers(imgPath, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
    // configurations
    if (Object.keys(clothes[i].configs).length > 0) {
      for (const configName in clothes[i].configs) {
        [bodyClothes, leftHandClothes, rightHandClothes] = clotheSubLayers(`${imgPath}${configName.replace(/ /g, "_")}/${clothes[i].configs[configName].replace(/ /g, "_")}_`, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
        for (const subName in clothes[i].subs) {
          if (subName === "color" || subName === "color1") {
            continue;
          }
          else {
            if (subName.includes("color")) {
              [bodyClothes, leftHandClothes, rightHandClothes] = clotheSubLayers(`${imgPath}${configName.replace(/ /g, "_")}/${clothes[i].configs[configName].replace(/ /g, "_")}_${subName}_`, colorConvert(clothes[i].subs[subName]) as string, bodyClothes, leftHandClothes, rightHandClothes);
            }
          }
        }
      }
    }
    // sub
    for (const subName in clothes[i].subs) {
      if (subName === "color" || subName === "color1") {
        continue;
      }
      else {
        if (subName.includes("color")) {
          [bodyClothes, leftHandClothes, rightHandClothes] = clotheSubLayers(`${imgPath}${subName}`, colorConvert(clothes[i].subs[subName]) as string, bodyClothes, leftHandClothes, rightHandClothes);
        }
        else {
          [bodyClothes, leftHandClothes, rightHandClothes] = clotheSubLayers(`${imgPath}${subName}/${clothes[i].subs[subName].replace(/ /g, "_")}_`, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
        }
      }
    }
  }
  return [bodyClothes, leftHandClothes, rightHandClothes];
}

export async function paperdollPC(canvas: HTMLCanvasElement) {
  const p = new PaperDollSystem(canvas);

  // 加载人模
  await p.loadBaseModel("res/body/basenoarms.png");

  V.pc.get_clothingItems_classes();
  const clothes = V.pc.clothes;
  clothes.sort((a: any, b: any) => setup.clothes[a.item].layer - setup.clothes[b.item].layer);

  const [bodyClothes, leftHandClothes, rightHandClothes] = clotheLayers(clothes, [], [], []);
  // 开始图层加载
  // 后发
  await p.loadLayer(`res/hair/back/${V.pc["hair style"].replace(/ /g, "_")}/${V.pc["hair length"].replace(/ /g, "_")}.png`, colorConvert(V.pc["hair color"]) as string);
  // 身体(无手)
  await p.loadLayer("res/body/basenoarms.png");
  // 头
  await p.loadLayer("res/body/basehead.png");
  await p.loadLayer("res/face/face.png");
  // 眼睛
  await p.loadLayer("res/face/eyes.png", colorConvert(V.pc["eye color"]) as string);

  // 身体衣服
  for (let i = 0; i < bodyClothes.length; i++) {
    if (bodyClothes[i].color)
      await p.loadLayer(bodyClothes[i].path, bodyClothes[i].color);
    else await p.loadLayer(bodyClothes[i].path);
  }
  // 手
  await p.loadLayer("res/body/leftarm.png");

  if (V.pc.has_part("penis") && V.pc.is_part_visible("penis")) {
    await p.loadLayer(V.pc.virgin() ? `res/body/penis/penis_virgin${Math.floor(V.pc["penis size"] / 200) - 2}.png` : `res/body/penis/penis${Math.floor(V.pc["penis size"] / 200) - 2}.png`);
  }
  else if (V.pc.has_part("breasts") && V.pc.is_part_visible("nipples")) {
    await p.loadLayer(`res/body/breasts/breasts${Math.floor(V.pc["breast size"] / 200)}.png`);
  }

  // 左手衣服
  for (let i = 0; i < leftHandClothes.length; i++) {
    if (leftHandClothes[i].color)
      await p.loadLayer(leftHandClothes[i].path, leftHandClothes[i].color);
    else await p.loadLayer(leftHandClothes[i].path);
  }
  // 右手
  await p.loadLayer("res/body/rightarm.png");
  // 右手衣服
  for (let i = 0; i < rightHandClothes.length; i++) {
    if (rightHandClothes[i].color)
      await p.loadLayer(rightHandClothes[i].path, rightHandClothes[i].color);
    else await p.loadLayer(rightHandClothes[i].path);
  }

  // 前发
  await p.loadLayer(`res/hair/front/${V.pc["hair style"].replace(/ /g, "_")}/${V.pc["hair length"].replace(/ /g, "_")}.png`, colorConvert(V.pc["hair color"]) as string);

  function calculateScale(height: number) {
    if (height <= 0)
      return 0;

    if (height <= 64) {
      return (2.75 / 64) * height;
    }
    else if (height <= 256) {
      return 1.75 * (height - 64) / 192;
    }
    else {
      return 1.75 * (height - 256) / 192;
    }
  }
  canvas.style.transform = `scale(${calculateScale(p.canvas.height)})`;
  setTimeout(() => {
    console.log("All layers loaded");
    p.draw();
  }, 50);
  return p;
}
