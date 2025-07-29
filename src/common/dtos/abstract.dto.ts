export abstract class AbstractDto {
  readonly uuid: string;

  constructor(abstract: any) {
    this.uuid = abstract.uuid;
  }
}
