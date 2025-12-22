import { ConsultaSchema } from '../plugins/consulta/infosimples/types2';
export declare class OpenApiParser {
    parse(yamlContent: string): ConsultaSchema[];
    private buildSchema;
    private extractFields;
    private inferType;
    private getValidation;
    static loadFromFile(filePath: string): ConsultaSchema[];
    parseFromFile(filePath: string): ConsultaSchema[];
}
//# sourceMappingURL=openapiParser.d.ts.map