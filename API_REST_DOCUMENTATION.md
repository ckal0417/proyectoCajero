# 🚀 API REST - Banco Fuego

## Resumen de Cambios

Se ha transformado el proyecto de una aplicación CLI a una **API REST completa** con:

### ✅ Completado

1. **Express Server**
   - Servidor HTTP en `http://localhost:3000`
   - Documentación Swagger en `http://localhost:3000/docs`
   - Middleware de CORS, helmet, autenticación JWT

2. **Autenticación JWT**
   - Endpoint: `POST /api/auth/login`
   - Login con número de tarjeta + PIN
   - Genera token JWT de 24 horas
   - Token requerido para acceder a operaciones

3. **Operaciones Bancarias**
   - `GET /api/operaciones/saldo` - Consultar saldo
   - `POST /api/operaciones/depositar` - Realizar depósito
   - `POST /api/operaciones/retirar` - Realizar retiro
   - `POST /api/operaciones/transferir` - Transferencias entre cuentas
   - `GET /api/operaciones/historial` - Historial de transacciones

4. **Logging Estructurado**
   - Winston logger a ficheros: `/logs/error.log` y `/logs/combined.log`
   - Logs en desarrollo también en consola
   - Cada request es registrado

5. **Documentación Swagger**
   - OpenAPI 3.0 spec
   - Endpoints documentados con ejemplos
   - Interfaz interactiva en `/docs`

---

## 📖 Cómo Usar la API

### 1. Iniciar el Servidor

```bash
npm run dev
```

Servidor disponible en: `http://localhost:3000`

### 2. Documentación

Visita: `http://localhost:3000/docs`

---

## 🔐 Endpoints

### 1. Autenticación

**POST `/api/auth/login`**

```json
{
  "numeroTarjeta": "122333",
  "pin": "1234"
}
```

Response (200):

```json
{
  "mensaje": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "nombre": "Cristopher Vera",
    "numeroTarjeta": "122333",
    "saldo": 500
  }
}
```

### 2. Consultar Saldo

**GET `/api/operaciones/saldo`**

Headers:

```
Authorization: Bearer <TOKEN>
```

Response (200):

```json
{
  "saldo": 500
}
```

### 3. Depositar

**POST `/api/operaciones/depositar`**

Headers:

```
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

Body:

```json
{
  "monto": 100
}
```

Response (200):

```json
{
  "mensaje": "Depósito exitoso",
  "nuevoSaldo": 600
}
```

### 4. Retirar

**POST `/api/operaciones/retirar`**

Headers:

```
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

Body:

```json
{
  "monto": 50
}
```

Response (200):

```json
{
  "mensaje": "Retiro exitoso",
  "nuevoSaldo": 550
}
```

### 5. Transferir

**POST `/api/operaciones/transferir`**

Headers:

```
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

Body:

```json
{
  "numeroCuentaDestino": "100002",
  "monto": 200
}
```

Response (200):

```json
{
  "mensaje": "Transferencia exitosa",
  "nuevoSaldo": 350
}
```

### 6. Historial de Transacciones

**GET `/api/operaciones/historial`**

Headers:

```
Authorization: Bearer <TOKEN>
```

Response (200):

```json
{
  "historial": [
    {
      "tipo": "DEPOSITO",
      "monto": 500,
      "fecha": "2026-07-06T23:05:58.436Z"
    },
    {
      "tipo": "RETIRO",
      "monto": 100,
      "fecha": "2026-07-10T23:05:58.436Z"
    }
  ]
}
```

## 📝 Ficheros Creados/Modificados

### Nuevos Archivos:

- `src/shared/Logger.ts` - Logger con Winston
- `src/Presentation/Http/middleware/AuthMiddleware.ts` - Autenticación JWT
- `src/Presentation/Http/controllers/AuthController.ts` - Controlador de login
- `src/Presentation/Http/controllers/OperacionesController.ts` - Controlador de operaciones
- `src/Application/services/OperacionesService.ts` - Lógica de operaciones
- `src/Presentation/Http/swagger.ts` - Configuración de Swagger

### Modificados:

- `src/index.ts` - Cambiado de CLI a Express server
- `src/Presentation/Http/routes.ts` - Nuevas rutas REST
- `src/Infrastructure/Database/migrate.ts` - Mejorada tolerancia de errores
- `package.json` - Nuevas dependencias y scripts

---

## 🔄 Flujo de Uso

```
1. Cliente HTTP → POST /api/auth/login (tarjeta + PIN)
2. Servidor valida credenciales → Genera JWT token
3. Cliente usa token en headers (Authorization: Bearer TOKEN)
4. Servidor verifica token en cada request
5. Si válido → Ejecuta operación
6. Si inválido → Retorna 401 Unauthorized
```

---

## 📊 Logs

Los logs se guardan en:

- `/logs/error.log` - Solo errores
- `/logs/combined.log` - Todos los eventos

Ejemplo de log:

```json
{
  "level": "info",
  "message": "Login exitoso para tarjeta: 122333",
  "timestamp": "2026-07-13 10:30:45",
  "service": "BancoFuego-API"
}
```

---

## 🛡️ Seguridad

- ✅ JWT para autenticación
- ✅ Helmet para headers de seguridad
- ✅ CORS configurado
- ✅ Validación de entrada en todos los endpoints
- ✅ Logs de todos los eventos

---

## 🚀 Próximos Pasos

- [ ] Implementar bcrypt para hash de PIN en producción
- [ ] Agregar endpoints adicionales (consultar transferencias, generar reportes)
- [ ] Agregar tests unitarios e integración
- [ ] Desplegar en producción con Docker

---

## 📞 Soporte

Para más información, revisa:

- Documentación Swagger: `http://localhost:3000/docs`
- Logs: `/logs/combined.log`
- Código fuente: `src/Presentation/Http/`
