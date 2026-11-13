import * as T from './vendor/three.module.js';
import {HDRLoader} from './vendor/HDRLoader.js';
export function improveWorld({scene,terrain,renderer,materials,heli,water}){
 const loader=new T.TextureLoader();const load=(file,color=false,repeat=1)=>{const t=loader.load('./assets/'+file);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=renderer.software?1:Math.min(4,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=T.SRGBColorSpace;return t;};
 if(renderer.software)return;
 // Real photographed CC0 surface maps. One shared material; no displacement tessellation.
 const ground=load('ground-color.jpg',true,72),normal=load('ground-normal.jpg',false,72),rough=load('ground-rough.jpg',false,72),coast=load('coast-color.jpg',true,72),coastN=load('coast-normal.jpg',false,72),coastR=load('coast-rough.jpg',false,72);
 const m=new T.MeshStandardMaterial({map:ground,normalMap:normal,roughnessMap:rough,normalScale:new T.Vector2(.65,.65),roughness:.98,color:0xd8dcc4});
 m.onBeforeCompile=shader=>{shader.uniforms.coastMap={value:coast};shader.uniforms.coastNormal={value:coastN};shader.uniforms.coastRough={value:coastR};shader.vertexShader='varying vec3 terrainPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nterrainPosition=position;');shader.fragmentShader='uniform sampler2D coastMap;uniform sampler2D coastNormal;uniform sampler2D coastRough;varying vec3 terrainPosition;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 float coastMix=1.0-smoothstep(3.0,17.0,terrainPosition.y);
 vec4 coastTex=texture2D(coastMap,vMapUv);diffuseColor.rgb=mix(diffuseColor.rgb,coastTex.rgb,coastMix*.88);
 float macroShade=.91+.09*sin(terrainPosition.x*.007)*cos(terrainPosition.z*.009);diffuseColor.rgb*=macroShade;`);
 shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',T.ShaderChunk.normal_fragment_maps).replace('#include <roughnessmap_fragment>',T.ShaderChunk.roughnessmap_fragment);
 // Standard normal mapping remains engine-owned. Blend shore detail at the sample.
 shader.fragmentShader=shader.fragmentShader.replace('vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;','vec3 mapN = mix(texture2D(normalMap,vNormalMapUv).xyz,texture2D(coastNormal,vNormalMapUv).xyz,1.0-smoothstep(3.0,17.0,terrainPosition.y))*2.0-1.0;');
 shader.fragmentShader=shader.fragmentShader.replace('vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );','vec4 texelRoughness = mix(texture2D(roughnessMap,vRoughnessMapUv),texture2D(coastRough,vRoughnessMapUv),1.0-smoothstep(3.0,17.0,terrainPosition.y));');};m.customProgramCacheKey=()=> 'shore-v2';terrain.material=m;
 const environment=new HDRLoader();environment.load('./assets/sky.hdr',texture=>{texture.mapping=T.EquirectangularReflectionMapping;const pmrem=new T.PMREMGenerator(renderer),baked=pmrem.fromEquirectangular(texture);scene.environment=baked.texture;scene.background=texture;scene.backgroundIntensity=.65;scene.environmentIntensity=.40;scene.backgroundBlurriness=.025;pmrem.dispose();},undefined,()=>{});
 // Shared fine finish for metal parts. Surface grain is inexpensive and generated once.
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),data=ctx.createImageData(256,256);let s=129;for(let i=0;i<data.data.length;i+=4){s=(s*1664525+1013904223)>>>0;const v=112+(s%43);data.data[i]=data.data[i+1]=data.data[i+2]=v;data.data[i+3]=255;}ctx.putImageData(data,0,0);const finish=new T.CanvasTexture(c);finish.wrapS=finish.wrapT=T.RepeatWrapping;finish.repeat.set(3,3);
 heli.traverse(o=>{if(o.isMesh&&o.material.isMeshStandardMaterial){o.material.roughness=Math.max(.28,o.material.roughness*.82);o.material.metalness=Math.max(.18,o.material.metalness);o.material.bumpMap=finish;o.material.bumpScale=.018;o.material.needsUpdate=true;}});
}
