import 'reflect-metadata';

import format from 'string-template';

import { assert } from 'chai';

import { ServiceIdentifiers } from '../../../../../../src/container/ServiceIdentifiers';

import { ICryptUtilsSwappedAlphabet } from '../../../../../../src/interfaces/utils/ICryptUtilsSwappedAlphabet';
import { IInversifyContainerFacade } from '../../../../../../src/interfaces/container/IInversifyContainerFacade';
import { IObfuscatedCode } from '../../../../../../src/interfaces/source-code/IObfuscatedCode';
import { IRandomGenerator } from '../../../../../../src/interfaces/utils/IRandomGenerator';

import { AtobTemplate } from '../../../../../../src/custom-code-helpers/string-array/templates/string-array-calls-wrapper/AtobTemplate';
import { Rc4Template } from '../../../../../../src/custom-code-helpers/string-array/templates/string-array-calls-wrapper/Rc4Template';
import { StringArrayBase64DecodeTemplate } from '../../../../../../src/custom-code-helpers/string-array/templates/string-array-calls-wrapper/StringArrayBase64DecodeTemplate';
import { StringArrayCallsWrapperTemplate } from '../../../../../../src/custom-code-helpers/string-array/templates/string-array-calls-wrapper/StringArrayCallsWrapperTemplate';
import { StringArrayRC4DecodeTemplate } from '../../../../../../src/custom-code-helpers/string-array/templates/string-array-calls-wrapper/StringArrayRC4DecodeTemplate';

import { NO_ADDITIONAL_NODES_PRESET } from '../../../../../../src/options/presets/NoCustomNodes';

import { InversifyContainerFacade } from '../../../../../../src/container/InversifyContainerFacade';
import { JavaScriptObfuscator } from '../../../../../../src/JavaScriptObfuscatorFacade';
import { readFileAsString } from '../../../../../helpers/readFileAsString';

describe('StringArrayCallsWrapperTemplate', () => {
    const stringArrayName: string = 'stringArrayName';
    const stringArrayCallsWrapperName: string = 'stringArrayCallsWrapperName';
    const atobFunctionName: string = 'atob';

    let cryptUtilsSwappedAlphabet: ICryptUtilsSwappedAlphabet,
        randomGenerator: IRandomGenerator;

    before(() => {
        const inversifyContainerFacade: IInversifyContainerFacade = new InversifyContainerFacade();

        inversifyContainerFacade.load('', '', {});
        cryptUtilsSwappedAlphabet = inversifyContainerFacade
            .get<ICryptUtilsSwappedAlphabet>(ServiceIdentifiers.ICryptUtilsSwappedAlphabet);
        randomGenerator = inversifyContainerFacade
            .get<IRandomGenerator>(ServiceIdentifiers.IRandomGenerator);
    });

    describe('Variant #1: `base64` encoding', () => {
        const index: string = '0x0';
        const expectedDecodedValue: string = 'test1';

        let decodedValue: string;

        before(() => {
            const atobPolyfill = format(AtobTemplate(), {
                atobFunctionName
            });
            const atobDecodeTemplate: string = format(
                StringArrayBase64DecodeTemplate(randomGenerator),
                {
                    atobPolyfill,
                    atobFunctionName,
                    selfDefendingCode: '',
                    stringArrayCallsWrapperName
                }
            );
            const stringArrayCallsWrapperTemplate: string = format(StringArrayCallsWrapperTemplate(), {
                decodeCodeHelperTemplate: atobDecodeTemplate,
                stringArrayCallsWrapperName,
                stringArrayName
            });

            decodedValue = Function(`
                var ${stringArrayName} = ['${cryptUtilsSwappedAlphabet.btoa('test1')}'];
            
                ${stringArrayCallsWrapperTemplate}
                
                return ${stringArrayCallsWrapperName}(${index});
            `)();
        });

        it('should correctly return decoded value', () => {
            assert.deepEqual(decodedValue, expectedDecodedValue);
        });
    });

    describe('Variant #2: `rc4` encoding', () => {
        const index: string = '0x0';
        const key: string = 'key';
        const expectedDecodedValue: string = 'test1';

        let decodedValue: string;

        before(() => {
            const atobPolyfill = format(AtobTemplate(), {
                atobFunctionName
            });
            const rc4Polyfill = format(Rc4Template(), {
                atobFunctionName
            });
            const rc4decodeCodeHelperTemplate: string = format(
                StringArrayRC4DecodeTemplate(randomGenerator),
                {
                    atobPolyfill,
                    rc4Polyfill,
                    selfDefendingCode: '',
                    stringArrayCallsWrapperName
                }
            );
            const stringArrayCallsWrapperTemplate: string = format(StringArrayCallsWrapperTemplate(), {
                decodeCodeHelperTemplate: rc4decodeCodeHelperTemplate,
                stringArrayCallsWrapperName,
                stringArrayName
            });

            decodedValue = Function(`
                var ${stringArrayName} = ['${cryptUtilsSwappedAlphabet.btoa(cryptUtilsSwappedAlphabet.rc4('test1', key))}'];
            
                ${stringArrayCallsWrapperTemplate}
                
                return ${stringArrayCallsWrapperName}('${index}', '${key}');
            `)();
        });

        it('should correctly return decoded value', () => {
            assert.deepEqual(decodedValue, expectedDecodedValue);
        });
    });

    describe('Prevailing kind of variables', () => {
        describe('`var` kind', () => {
            let obfuscatedCode: string,
                stringArrayCallsWrapperRegExp: RegExp = /var (_0x(\w){4}) *= *function/;

            beforeEach(() => {
                const code: string = readFileAsString(__dirname + '/fixtures/prevailing-kind-of-variables-var.js');
                const obfuscatedCodeObject: IObfuscatedCode = JavaScriptObfuscator.obfuscate(
                    code,
                    {
                        ...NO_ADDITIONAL_NODES_PRESET,
                        stringArray: true,
                        stringArrayThreshold: 1
                    }
                );

                obfuscatedCode = obfuscatedCodeObject.getObfuscatedCode();
            });

            it('Should return correct kind of variables for string array calls wrapper', () => {
                assert.match(obfuscatedCode, stringArrayCallsWrapperRegExp);
            });

            it('Should does not break on obfuscating', () => {
                assert.doesNotThrow(() => obfuscatedCode);
            });
        });

        describe('`const` kind', () => {
            let obfuscatedCode: string,
                stringArrayCallsWrapperRegExp: RegExp = /const (_0x(\w){4}) *= *function/;

            beforeEach(() => {
                const code: string = readFileAsString(__dirname + '/fixtures/prevailing-kind-of-variables-const.js');
                const obfuscatedCodeObject: IObfuscatedCode = JavaScriptObfuscator.obfuscate(
                    code,
                    {
                        ...NO_ADDITIONAL_NODES_PRESET,
                        stringArray: true,
                        stringArrayThreshold: 1
                    }
                );

                obfuscatedCode = obfuscatedCodeObject.getObfuscatedCode();
            });

            it('Should return correct kind of variables for string array calls wrapper', () => {
                assert.match(obfuscatedCode, stringArrayCallsWrapperRegExp);
            });

            it('Should does not break on obfuscating', () => {
                assert.doesNotThrow(() => obfuscatedCode);
            });
        });

        describe('`let` kind', () => {
            let obfuscatedCode: string,
                stringArrayCallsWrapperRegExp: RegExp = /const (_0x(\w){4}) *= *function/;

            beforeEach(() => {
                const code: string = readFileAsString(__dirname + '/fixtures/prevailing-kind-of-variables-let.js');
                const obfuscatedCodeObject: IObfuscatedCode = JavaScriptObfuscator.obfuscate(
                    code,
                    {
                        ...NO_ADDITIONAL_NODES_PRESET,
                        stringArray: true,
                        stringArrayThreshold: 1
                    }
                );

                obfuscatedCode = obfuscatedCodeObject.getObfuscatedCode();
            });

            it('Should return correct kind of variables for string array calls wrapper', () => {
                assert.match(obfuscatedCode, stringArrayCallsWrapperRegExp);
            });

            it('Should does not break on obfuscating', () => {
                assert.doesNotThrow(() => obfuscatedCode);
            });
        });
    });
});
