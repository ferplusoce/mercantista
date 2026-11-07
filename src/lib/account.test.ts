import { describe, it, expect } from "vitest";
import { phoneToEmail, validateCredentials } from "./account";

describe("cuentas por celular", () => {
  it("acepta celular de 9 dígitos que empieza con 9 y contraseña de 6", () => {
    expect(validateCredentials("987654321", "123456")).toBeNull();
  });
  it("rechaza celular que no empieza con 9 o no tiene 9 dígitos", () => {
    expect(validateCredentials("887654321", "123456")).not.toBeNull();
    expect(validateCredentials("98765432", "123456")).not.toBeNull();
  });
  it("rechaza contraseña de menos de 6 caracteres", () => {
    expect(validateCredentials("987654321", "12345")).not.toBeNull();
  });
  it("usa el celular como correo interno", () => {
    expect(phoneToEmail("987 654 321")).toBe("987654321@clientes.mercantista.pe");
  });
});
