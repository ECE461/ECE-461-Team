"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const PackageQuery_1 = require("../../src/models/package/PackageQuery");
function testGetPackagesByQuery(query, offset = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const BASE_API = 'http://localhost:3000/api/v1';
            const queryArray = [query.getJson()];
            const response = yield axios_1.default.post(BASE_API + '/packages', queryArray, { params: { offset } });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching patches: ', error);
        }
    });
}
testGetPackagesByQuery(new PackageQuery_1.PackageQuery('package-name', '1.0.0'))
    .then(packages => {
    console.log(packages);
})
    .catch(error => console.error(error.message));
