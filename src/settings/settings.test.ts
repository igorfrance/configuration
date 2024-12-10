import { expect, describe, it } from "vitest";
import { Settings } from ".";
import { config } from "./decorators";

const optional = true;
const scalar = config.scalar;

describe("Settings", () => {
    class TestSettings1 extends Settings {

        @scalar({ name: "PROP1" })
        public prop1: string;

        @scalar({ name: "PROP2" })
        public prop2: string;

        @scalar({ name: "PROP3", default: "VALUE" })
        public prop3: string;

        @scalar({ name: "PROP4", optional })
        public prop4: string;
    }

    class TestSettings2 extends Settings {

        @scalar({ name: "PROP5" })
        public prop5: string;

        settings1 = new TestSettings1();
    }

    class TestSettings3 extends TestSettings2 {

        @scalar({ name: "PROP6" })
        public pro6: string;

        settings4 = new TestSettings4();
    }

    class TestSettings4 extends Settings {

        @scalar({ name: "PROP7" })
        public prop7: string;

        settings5 = new TestSettings5();
    }

    class TestSettings5 extends Settings {
    }

    const t1 = new TestSettings1();
    const t2 = new TestSettings2();
    const t3 = new TestSettings3();

    describe("defaults", () => {

        it("should have correct default values", () => {
            expect(t1.prop1).toBeUndefined();
            expect(t1.prop2).toBeUndefined();
            expect(t1.prop3).toBe("VALUE");
            expect(t1.prop4).toBeUndefined();
            expect(t2.prop5).toBeUndefined();
        });
    });

    describe("getSettings", () => {

        it("should return correct settings", () => {
            expect(Object.keys(t3.getSettings()).length).toBe(2);
            expect(Object.keys(t3.getSettings(true)).length).toBe(3);
            expect(Object.keys(t2.getSettings()).length).toBe(1);
            expect(Object.keys(t2.getSettings(true)).length).toBe(1);
            expect(Object.keys(t2.getSettings())[0]).toBe("settings1");
        });

    });

    describe("getVariables", () => {

        it("should return correct variables", () => {
            expect(Object.keys(t1.getVariables()).length).toBe(4);
            expect(Object.keys(t2.getVariables()).length).toBe(1);
            expect(Object.keys(t2.getVariables(true)).length).toBe(5);
            expect(Object.keys(t3.getVariables()).length).toBe(2);
            expect(Object.keys(t3.getVariables(true)).length).toBe(7);
            expect(Object.keys(t2.getVariables())[0]).toBe("prop5");
            expect(Object.keys(t1.getVariables(true)).length).toBe(4);
            expect(Object.keys(t2.getVariables(true)).length).toBe(5);
            expect(Object.keys(t2.getVariables(true))[0]).toBe("prop5");
        });
    });

    describe("getInvalidVariables", () => {

        it("should detect required variables that dont have valid values", () => {
            expect(Object.keys(t2.getInvalidVariables()).length).toBe(1);
            expect(Object.keys(t2.getInvalidVariables(true)).length).toBe(3);
            expect(Object.keys(t3.getInvalidVariables(true)).length).toBe(5);
        });

    });
});
