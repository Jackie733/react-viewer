import { OpacityFunction } from '@/types/views';
import vtkPiecewiseFunctionProxy from '@kitware/vtk.js/Proxy/Core/PiecewiseFunctionProxy';
import vtkColorMaps from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps';

/**
 * Retrieves the color function range, if any.
 *
 * Will only return the color function range if the preset
 * has AbsoluteRange specified as true. For medical presets,
 * the range is defined by the transfer function point range,
 * rather than the dataset data range.
 * @param presetName
 * @returns
 */
export function getColorFunctionRangeFromPreset(
  presetName: string,
): [number, number] | null {
  const preset = vtkColorMaps.getPresetByName(presetName);
  if (!preset) return null;

  const { AbsoluteRange, RGBPoints } = preset;
  if (AbsoluteRange && RGBPoints) {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < RGBPoints.length; i += 4) {
      min = Math.min(min, RGBPoints[i]);
      max = Math.max(max, RGBPoints[i]);
    }
    return [min, max];
  }
  return null;
}

/**
 * Retrieves an OpacityFunction from a preset.
 */
export function getOpacityFunctionFromPreset(
  presetName: string,
): Partial<OpacityFunction> {
  const preset = vtkColorMaps.getPresetByName(presetName);

  if (preset.OpacityPoints) {
    return {
      mode: vtkPiecewiseFunctionProxy.Mode.Points,
      preset: presetName,
      shift: 0,
      shiftAlpha: 0,
    };
  }
  return {
    mode: vtkPiecewiseFunctionProxy.Mode.Gaussians,
    // deep-copy necessary
    gaussians: JSON.parse(
      JSON.stringify(vtkPiecewiseFunctionProxy.Defaults.Gaussians),
    ),
  };
}
