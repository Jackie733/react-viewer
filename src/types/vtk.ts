import { vtkObject } from '@kitware/vtk.js/interfaces';
import vtkAbstractMapper from '@kitware/vtk.js/Rendering/Core/AbstractMapper';
import vtkProp from '@kitware/vtk.js/Rendering/Core/Prop';

export type VtkObjectConstructor<T> = {
  newInstance(props?: Record<string, unknown>): T;
};

export type vtkPropWithMapperProperty<
  M extends vtkAbstractMapper = vtkAbstractMapper,
  P extends vtkObject = vtkObject,
> = vtkProp & {
  setMapper(m: M): void;
  getProperty(): P;
};

export interface Representation<
  Actor extends vtkPropWithMapperProperty,
  Mapper extends vtkAbstractMapper,
> {
  actor: Actor;
  mapper: Mapper;
  property: ReturnType<Actor['getProperty']>;
}
