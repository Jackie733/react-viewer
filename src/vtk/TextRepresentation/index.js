import macro from '@kitware/vtk.js/macros';
import vtkContextRepresentation from '@kitware/vtk.js/Widgets/Representations/ContextRepresentation';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkPoints from '@kitware/vtk.js/Common/Core/Points';
import vtkCellArray from '@kitware/vtk.js/Common/Core/CellArray';

// 自定义文本表示类
function vtkTextRepresentation(publicAPI, model) {
  model.classHierarchy.push('vtkTextRepresentation');

  function requestData(inData, outData) {
    const state = inData[0];

    if (!state || !state.getVisible()) {
      outData[0] = vtkPolyData.newInstance();
      return;
    }

    const origin = state.getOrigin();
    const text = state.getText ? state.getText() : '';

    // 创建一个小的标记点来表示文本位置
    const polydata = vtkPolyData.newInstance();

    if (origin && text) {
      const points = vtkPoints.newInstance();
      const verts = vtkCellArray.newInstance();

      // 在文本位置创建一个小的点
      points.setData(new Float32Array([...origin]), 3);
      verts.insertNextCell([0]);

      polydata.setPoints(points);
      polydata.setVerts(verts);

      // 将文本信息作为字段数据存储
      const textArray = new Array(1).fill(text);
      polydata.getFieldData().setData([textArray]);
    }

    outData[0] = polydata;
  }

  publicAPI.requestData = requestData;

  // 初始化actor和mapper
  if (!model.actor) {
    model.actor = vtkActor.newInstance();
    model.mapper = vtkMapper.newInstance();
    model.actor.setMapper(model.mapper);

    // 设置点的大小和颜色
    model.actor.getProperty().setPointSize(8);
    model.actor.getProperty().setColor(1, 1, 1);
    model.actor.getProperty().setRepresentationToPoints();

    // 使用publicAPI.addActor()来正确初始化actor
    publicAPI.addActor(model.actor);
  }
}

const DEFAULT_VALUES = {
  behavior: 'context',
  pickable: false,
  dragable: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkContextRepresentation.extend(publicAPI, model, initialValues);
  vtkTextRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTextRepresentation');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
