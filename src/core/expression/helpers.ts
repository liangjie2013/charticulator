import {
  BooleanValue,
  DateValue,
  Expression,
  FieldAccess,
  FunctionCall,
  LambdaFunction,
  NumberValue,
  Operator,
  StringValue,
  Variable,
  TextExpression,
  Context
} from "./classes";

export function variable(name: string): Variable {
  return new Variable(name);
}

export function functionCall(
  functionName: string,
  ...args: Expression[]
): FunctionCall {
  const fields = functionName.split(".");
  if (fields.length == 1) {
    return new FunctionCall(new Variable(functionName), args);
  } else {
    return new FunctionCall(
      new FieldAccess(new Variable(fields[0]), fields.slice(1)),
      args
    );
  }
}

export function lambda(names: string[], expression: Expression) {
  return new LambdaFunction(expression, names);
}

export function fields(expr: Expression, ...fields: string[]) {
  return new FieldAccess(expr, fields);
}

export function add(lhs: Expression, rhs: Expression) {
  return new Operator("+", lhs, rhs);
}
export function sub(lhs: Expression, rhs: Expression) {
  return new Operator("-", lhs, rhs);
}
export function mul(lhs: Expression, rhs: Expression) {
  return new Operator("*", lhs, rhs);
}
export function div(lhs: Expression, rhs: Expression) {
  return new Operator("/", lhs, rhs);
}

export function number(v: number) {
  return new NumberValue(v);
}
export function string(v: string) {
  return new StringValue(v);
}
export function boolean(v: boolean) {
  return new BooleanValue(v);
}
export function date(v: Date) {
  return new DateValue(v);
}

export class ExpressionCache {
  private items = new Map<string, Expression>();
  private textItems = new Map<string, TextExpression>();
  public clear() {
    this.items.clear();
    this.textItems.clear();
  }

  public parse(expr: string): Expression {
    if (this.items.has(expr)) {
      return this.items.get(expr);
    } else {
      const result = Expression.Parse(expr);
      this.items.set(expr, result);
      return result;
    }
  }

  public parseTextExpression(expr: string): TextExpression {
    if (this.textItems.has(expr)) {
      return this.textItems.get(expr);
    } else {
      const result = TextExpression.Parse(expr);
      this.textItems.set(expr, result);
      return result;
    }
  }
}

export interface VerifyUserExpressionOptions {
  /** Specify this to verify expression against data */
  data?: Iterable<Context>;
  /** Specify this to verify return types */
  expectedTypes?: string[];
  textExpression?: boolean;
}

export interface VerifyUserExpressionReport {
  /** Verification is passed */
  pass: boolean;
  /** Re-formatted expression if passed */
  formatted?: string;
  /** Error message if not passed */
  error?: string;
}

/**
 * Verify user input expression
 * @param inputString The expression from user input
 * @param options Verification options
 */
export function verifyUserExpression(
  inputString: string,
  options: VerifyUserExpressionOptions
): VerifyUserExpressionReport {
  let expr: Expression | TextExpression;
  // Try parse the expression
  try {
    if (options.textExpression) {
      expr = TextExpression.Parse(inputString);
    } else {
      expr = Expression.Parse(inputString);
    }
  } catch (error) {
    return {
      pass: false,
      error: "Parse Error: " + error.message
    };
  }
  if (options.data) {
    if (options.expectedTypes) {
      const expectedTypes = new Set(options.expectedTypes);
      try {
        for (const ctx of options.data) {
          const value = expr.getValue(ctx);
          let valueType: string = typeof value;
          if (value == null || valueType == "undefined") {
            valueType = "null";
          }
          if (!expectedTypes.has(valueType)) {
            return {
              pass: false,
              error: `Type Error: unexpected ${valueType} returned`
            };
          }
        }
      } catch (error) {
        return {
          pass: false,
          error: "Evaluate Error: " + error.message
        };
      }
    } else {
      try {
        for (const ctx of options.data) {
          expr.getValue(ctx);
        }
      } catch (error) {
        return {
          pass: false,
          error: "Evaluate Error: " + error.message
        };
      }
    }
  }
  return {
    pass: true,
    formatted: expr.toString()
  };
}
