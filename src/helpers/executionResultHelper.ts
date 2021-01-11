// (C) 2007-2021 GoodData Corporation
import { Execution } from "@gooddata/typings";
import * as invariant from "invariant";
import { IUnwrappedAttributeHeaderWithItems } from "../components/visualizations/typings/chart";
import { IMappingHeader } from "../interfaces/MappingHeader";
import { getMappingHeaderLocalIdentifier } from "./mappingHeader";

export function findInDimensionHeaders(
    dimensions: Execution.IResultDimension[],
    headerCallback: (
        headerType: string,
        header: any,
        dimensionIndex: number,
        headerIndex: number,
        headerCount: number,
    ) => any,
): any {
    let returnValue: any = null;
    for (let dimensionIndex = 0; dimensionIndex < dimensions.length; dimensionIndex++) {
        const dimension = dimensions[dimensionIndex];

        for (let headerIndex = 0; headerIndex < dimension.headers.length; headerIndex++) {
            const wrappedHeader = dimension.headers[headerIndex];
            const headerType = Object.keys(wrappedHeader)[0];
            const header = wrappedHeader[headerType];
            const headerCount = dimension.headers.length;
            returnValue = headerCallback(headerType, header, dimensionIndex, headerIndex, headerCount);

            if (!!returnValue) {
                break;
            }
        }

        if (!!returnValue) {
            break;
        }
    }

    return returnValue;
}

export function findMeasureGroupInDimensions(
    dimensions: Execution.IResultDimension[],
): Execution.IMeasureGroupHeader["measureGroupHeader"] {
    return findInDimensionHeaders(
        dimensions,
        (
            headerType: string,
            header: Execution.IMeasureGroupHeader["measureGroupHeader"],
            _dimensionIndex: number,
            headerIndex: number,
            headerCount: number,
        ) => {
            const measureGroupHeader = headerType === "measureGroupHeader" ? header : null;
            if (measureGroupHeader) {
                invariant(
                    headerIndex === headerCount - 1,
                    "MeasureGroup must be the last header in it's dimension",
                );
            }
            return measureGroupHeader;
        },
    );
}

export function findAttributeInDimension(
    dimension: Execution.IResultDimension,
    attributeHeaderItemsDimension: Execution.IResultHeaderItem[][],
    indexInDimension?: number,
): IUnwrappedAttributeHeaderWithItems {
    return findInDimensionHeaders(
        [dimension],
        (
            headerType: string,
            header: Execution.IAttributeHeader["attributeHeader"],
            _dimensionIndex: number,
            headerIndex: number,
        ) => {
            if (
                headerType === "attributeHeader" &&
                (indexInDimension === undefined || indexInDimension === headerIndex)
            ) {
                return {
                    ...header,
                    // attribute items are delivered separately from attributeHeaderItems
                    items: attributeHeaderItemsDimension[indexInDimension ? indexInDimension : 0],
                };
            }
            return null;
        },
    );
}

export function findMeasureHeaderByLocalIdentifier(
    executionResponse: Execution.IExecutionResponse,
    localIdentifier: string,
): IMappingHeader {
    const responseMeasureGroup = findMeasureGroupInDimensions(executionResponse.dimensions);
    if (!responseMeasureGroup) {
        return null;
    }
    const header = responseMeasureGroup.items.find(
        header => getMappingHeaderLocalIdentifier(header) === localIdentifier,
    );
    return header ? header : null;
}

export function getNthAttributeHeader(
    attributeHeaders: Execution.IAttributeHeader[],
    headerIndex: number,
): Execution.IAttributeHeader["attributeHeader"] {
    if (attributeHeaders.length && attributeHeaders[headerIndex]) {
        return attributeHeaders[headerIndex].attributeHeader;
    }
    return null;
}

export function getNthAttributeLocalIdentifier(
    rowAttributeHeaders: Execution.IAttributeHeader[],
    headerIndex: number,
): string {
    const attributeHeader = getNthAttributeHeader(rowAttributeHeaders, headerIndex);
    return attributeHeader && attributeHeader.localIdentifier;
}

export function getNthAttributeName(
    rowAttributeHeaders: Execution.IAttributeHeader[],
    headerIndex: number,
): string {
    const attributeHeader = getNthAttributeHeader(rowAttributeHeaders, headerIndex);
    return attributeHeader && attributeHeader.formOf.name;
}

export function getNthDimensionHeaders(
    executionResponse: Execution.IExecutionResponse,
    headerIndex: number,
): Execution.IHeader[] {
    if (executionResponse.dimensions.length && executionResponse.dimensions[headerIndex]) {
        return executionResponse.dimensions[headerIndex].headers;
    }
    return null;
}

export function getHeaderItemName(headerItem: Execution.IResultHeaderItem): string {
    if (headerItem && Execution.isAttributeHeaderItem(headerItem)) {
        return headerItem.attributeHeaderItem.name;
    }
    return "";
}

export function getAttributeHeadersInDimension(
    dimensions: Execution.IResultDimension[],
): Array<Execution.IAttributeHeader["attributeHeader"]> {
    return dimensions.reduce(
        (
            result: Array<Execution.IAttributeHeader["attributeHeader"]>,
            dimension: Execution.IResultDimension,
        ): Array<Execution.IAttributeHeader["attributeHeader"]> => {
            const { headers } = dimension;
            const filteredAttributeHeaders = headers.reduce(
                (
                    result: Array<Execution.IAttributeHeader["attributeHeader"]>,
                    header: Execution.IMeasureGroupHeader | Execution.IAttributeHeader,
                ): Array<Execution.IAttributeHeader["attributeHeader"]> => {
                    if (Execution.isAttributeHeader(header)) {
                        result.push(header.attributeHeader);
                    }
                    return result;
                },
                [],
            );
            return [...result, ...filteredAttributeHeaders];
        },
        [],
    );
}

export function getMeasureGroupHeaderItemsInDimension(
    dimensions: Execution.IResultDimension[],
): Execution.IMeasureHeaderItem[] {
    return dimensions.reduce(
        (
            result: Execution.IMeasureHeaderItem[],
            dimension: Execution.IResultDimension,
        ): Execution.IMeasureHeaderItem[] => {
            const { headers } = dimension;
            const filteredMeasureHeaders = headers.reduce(
                (
                    result: Execution.IMeasureHeaderItem[],
                    header: Execution.IMeasureGroupHeader | Execution.IAttributeHeader,
                ): Execution.IMeasureHeaderItem[] => {
                    if (Execution.isMeasureGroupHeader(header)) {
                        return [...result, ...header.measureGroupHeader.items];
                    }
                    return result;
                },
                [],
            );
            return [...result, ...filteredMeasureHeaders];
        },
        [],
    );
}

export function isTwoDimensionsData(
    data: Execution.DataValue[][] | Execution.DataValue[],
): data is Execution.DataValue[][] {
    return Array.isArray(data[0]);
}
