import { useEffect, memo, useMemo } from 'react';
import { ViewContext } from '@/types/views';
import { LPSAxisDir } from '@/types/lps';
import { useRoiStore } from '@/store/roi';
import { useDicomStore } from '@/store/dicom';
import { useImageStore } from '@/store/image';
import { RTROI, ContourPoint, ParsedRTStruct } from '@/io/dicomRTParser';
import { getROIColor } from '@/components/DataBase';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

interface SliceViewerROIProps {
  viewContext: ViewContext | null | undefined;
  viewDirection: LPSAxisDir;
  sliceIndex: number;
}

// 找出在当前切片附近的所有轮廓
function findContoursForSlice(
  roi: RTROI,
  viewDirection: LPSAxisDir,
  slicePosition: number,
  metadata: any, // 添加metadata参数以获取正确的空间信息
  tolerance: number = 0.5,
): ContourPoint[][] {
  const result: ContourPoint[][] = [];

  // 获取适当的坐标索引，基于视图方向
  let coordinateIndex: number;
  if (viewDirection === 'Superior' || viewDirection === 'Inferior') {
    coordinateIndex = 2; // Z轴 - 轴向视图
  } else if (viewDirection === 'Posterior' || viewDirection === 'Anterior') {
    coordinateIndex = 1; // Y轴 - 冠状视图
  } else {
    coordinateIndex = 0; // X轴 - 矢状视图
  }

  // 计算真实世界坐标中的切片位置
  let realSlicePosition = slicePosition;
  if (metadata && metadata.origin && metadata.spacing) {
    // 从图像原点和切片索引计算实际位置
    const originValue = metadata.origin[coordinateIndex];
    const spacingValue = metadata.spacing[coordinateIndex];
    realSlicePosition = originValue + slicePosition * spacingValue;
  }

  for (const contour of roi.rtroiContours) {
    if (contour.contourData.length === 0) continue;

    // 检查轮廓是否与切片相交
    let minDist = Infinity;
    for (const point of contour.contourData) {
      // 根据视图方向获取正确的坐标值
      let pointCoord;
      if (coordinateIndex === 0) {
        pointCoord = point.x;
      } else if (coordinateIndex === 1) {
        pointCoord = point.y;
      } else {
        pointCoord = point.z;
      }

      const dist = Math.abs(pointCoord - realSlicePosition);
      minDist = Math.min(minDist, dist);
    }

    // 如果轮廓在切片容差范围内，则添加到结果中
    if (minDist <= tolerance) {
      result.push(contour.contourData);
    }
  }

  return result;
}

// 创建线条轮廓的PolyData
function createContourLinesPolyData(
  contours: ContourPoint[][],
  viewDirection: LPSAxisDir,
  slicePosition: number,
  metadata: any,
): vtkPolyData {
  const polyData = vtkPolyData.newInstance();
  const points: number[] = [];
  const lines: number[] = []; // 用于边框

  // 获取适当的坐标索引和平面
  let coordinateIndex: number;
  let plane: [number, number, number]; // 确定哪三个坐标轴构成显示平面

  if (viewDirection === 'Superior' || viewDirection === 'Inferior') {
    coordinateIndex = 2; // Z轴 - 轴向视图
    plane = [0, 1, 2]; // XY平面，Z固定
  } else if (viewDirection === 'Posterior' || viewDirection === 'Anterior') {
    coordinateIndex = 1; // Y轴 - 冠状视图
    plane = [0, 2, 1]; // XZ平面，Y固定
  } else {
    coordinateIndex = 0; // X轴 - 矢状视图
    plane = [1, 2, 0]; // YZ平面，X固定
  }

  // 计算真实世界坐标中的切片位置
  let realSlicePosition = slicePosition;
  if (metadata && metadata.origin && metadata.spacing) {
    const originValue = metadata.origin[coordinateIndex];
    const spacingValue = metadata.spacing[coordinateIndex];
    realSlicePosition = originValue + slicePosition * spacingValue;
  }

  for (const contour of contours) {
    const startIndex = points.length / 3;
    const pointCount = contour.length;

    if (pointCount < 3) continue; // 需要至少3个点才能形成多边形

    // 添加每个点
    for (const point of contour) {
      const coords = [point.x, point.y, point.z];

      // 根据视图平面设置固定坐标
      coords[coordinateIndex] = realSlicePosition;

      // 按照平面定义顺序放入点数据
      points.push(coords[plane[0]], coords[plane[1]], coords[plane[2]]);
    }

    // 创建线段（闭合轮廓）
    if (pointCount > 0) {
      // 记录线段的点数（比轮廓点多1个，因为要闭合）
      lines.push(pointCount + 1);

      // 添加所有点的索引，包括回到起点的连接
      for (let i = 0; i < pointCount; i++) {
        lines.push(startIndex + i);
      }
      // 闭合轮廓 - 回到第一个点
      lines.push(startIndex);
    }
  }

  polyData.getPoints().setData(new Float32Array(points), 3);
  polyData.getLines().setData(new Uint32Array(lines));

  return polyData;
}

// 为填充创建一个单独的PolyData
function createContourFillsPolyData(
  contours: ContourPoint[][],
  viewDirection: LPSAxisDir,
  slicePosition: number,
  metadata: any,
): vtkPolyData {
  // 创建一个单独的PolyData用于所有填充
  const polyData = vtkPolyData.newInstance();
  const points: number[] = [];
  const polys: number[] = [];

  // 获取适当的坐标索引和平面
  let coordinateIndex: number;
  let plane: [number, number, number]; // 确定哪三个坐标轴构成显示平面

  if (viewDirection === 'Superior' || viewDirection === 'Inferior') {
    coordinateIndex = 2; // Z轴 - 轴向视图
    plane = [0, 1, 2]; // XY平面，Z固定
  } else if (viewDirection === 'Posterior' || viewDirection === 'Anterior') {
    coordinateIndex = 1; // Y轴 - 冠状视图
    plane = [0, 2, 1]; // XZ平面，Y固定
  } else {
    coordinateIndex = 0; // X轴 - 矢状视图
    plane = [1, 2, 0]; // YZ平面，X固定
  }

  // 计算真实世界坐标中的切片位置
  let realSlicePosition = slicePosition;
  if (metadata && metadata.origin && metadata.spacing) {
    const originValue = metadata.origin[coordinateIndex];
    const spacingValue = metadata.spacing[coordinateIndex];
    realSlicePosition = originValue + slicePosition * spacingValue;
  }

  // 处理每个轮廓
  for (const contour of contours) {
    if (contour.length < 3) continue; // 需要至少3个点才能形成多边形

    const startIndex = points.length / 3;

    // 添加每个点
    for (const point of contour) {
      const coords = [point.x, point.y, point.z];

      // 根据视图平面设置固定坐标
      coords[coordinateIndex] = realSlicePosition;

      // 按照平面定义顺序放入点数据
      points.push(coords[plane[0]], coords[plane[1]], coords[plane[2]]);
    }

    // 添加多边形定义
    polys.push(contour.length); // 多边形点数
    for (let i = 0; i < contour.length; i++) {
      polys.push(startIndex + i); // 使用偏移后的点索引
    }
  }

  if (points.length > 0) {
    polyData.getPoints().setData(new Float32Array(points), 3);
    polyData.getPolys().setData(new Uint32Array(polys));
  }

  return polyData;
}

const SliceViewerROI: React.FC<SliceViewerROIProps> = ({
  viewContext,
  viewDirection,
  sliceIndex,
}) => {
  // 直接监听visibleRois的值，当状态变化时会触发重新渲染
  const visibleRois = useRoiStore((state) => state.visibleRois);
  const { isRoiVisible } = useRoiStore();

  // 使用 useMemo 缓存从 store 获取的数据，避免无限循环
  const patientHierarchy = useDicomStore((state) => state.patientHierarchy);
  // 直接从imageStore获取metadata而不是volumeInfo.metadata
  const metadata = useImageStore((state) => state.metadata);

  // 缓存处理后的 RT Structure Sets 数据
  const roiStructSets = useMemo(() => {
    if (!patientHierarchy) return [];

    return patientHierarchy
      .flatMap((p) => p.studies)
      .flatMap((s) =>
        s.series.filter((series) => series.modality === 'RTSTRUCT'),
      ) as ParsedRTStruct[];
  }, [patientHierarchy]);

  useEffect(() => {
    if (!viewContext || !metadata) return;

    const { renderer, requestRender } = viewContext;
    const actors: vtkActor[] = [];

    // 移除所有现有的actor，完全重建
    // 这样可以避免任何识别ROI actor的问题
    const existingActors = renderer.getActors();
    existingActors.forEach((actor) => {
      renderer.removeActor(actor);
    });

    // 重新添加主要图像actor
    if (viewContext.actor) {
      renderer.addActor(viewContext.actor);
    }

    // 循环处理所有RT Structure Set
    for (const structSet of roiStructSets) {
      for (const roi of structSet.rois) {
        // 检查ROI是否可见
        if (!isRoiVisible(roi.roiNumber)) continue;

        // 找出当前切片上的轮廓
        const contours = findContoursForSlice(
          roi,
          viewDirection,
          sliceIndex,
          metadata,
        );
        if (contours.length === 0) continue;

        // 获取ROI颜色
        const roiColor = getROIColor(roi);
        const normalizedColor: [number, number, number] = [
          roiColor[0] / 255,
          roiColor[1] / 255,
          roiColor[2] / 255,
        ];

        // 1. 创建轮廓线
        const linesPolyData = createContourLinesPolyData(
          contours,
          viewDirection,
          sliceIndex,
          metadata,
        );

        const outlineMapper = vtkMapper.newInstance();
        outlineMapper.setInputData(linesPolyData);
        outlineMapper.setResolveCoincidentTopology(1);
        outlineMapper.setResolveCoincidentTopologyPolygonOffsetParameters(0, 1);

        const outlineActor = vtkActor.newInstance();
        outlineActor.setMapper(outlineMapper);
        outlineActor
          .getProperty()
          .setColor(normalizedColor[0], normalizedColor[1], normalizedColor[2]);
        outlineActor.getProperty().setLineWidth(2);
        outlineActor.getProperty().setOpacity(1.0);

        // 添加轮廓演员到渲染器
        renderer.addActor(outlineActor);
        actors.push(outlineActor);

        // 2. 创建填充 - 使用同一个轮廓点集但是不同的渲染方式
        try {
          const fillsPolyData = createContourFillsPolyData(
            contours,
            viewDirection,
            sliceIndex,
            metadata,
          );

          const fillMapper = vtkMapper.newInstance();
          fillMapper.setInputData(fillsPolyData);
          fillMapper.setResolveCoincidentTopology(1);
          fillMapper.setResolveCoincidentTopologyPolygonOffsetParameters(0, -1); // 负偏移确保填充在轮廓下方

          const fillActor = vtkActor.newInstance();
          fillActor.setMapper(fillMapper);
          fillActor
            .getProperty()
            .setColor(
              normalizedColor[0],
              normalizedColor[1],
              normalizedColor[2],
            );
          fillActor.getProperty().setOpacity(0.2); // 降低不透明度，避免遮挡
          fillActor.getProperty().setRepresentation(2); // 填充表示

          // 添加填充演员到渲染器
          renderer.addActor(fillActor);
          actors.push(fillActor);
        } catch (error) {
          // 如果填充创建失败，只显示轮廓
          console.warn('创建ROI填充失败，仅显示轮廓', error);
        }
      }
    }

    // 重新渲染
    requestRender();

    // 清理函数
    return () => {
      for (const actor of actors) {
        renderer.removeActor(actor);
      }
      requestRender();
    };
  }, [
    viewContext,
    viewDirection,
    sliceIndex,
    roiStructSets,
    isRoiVisible,
    metadata,
    visibleRois,
  ]);

  return null; // 这是一个纯功能组件，不渲染任何UI
};

export default memo(SliceViewerROI);
