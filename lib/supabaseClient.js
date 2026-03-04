class SupabaseProxyBuilder {
  constructor(table) {
    this.table = table;
    this.action = 'select';
    this.selectColumns = '*';
    this.payload = undefined;
    this.filters = [];
    this.orders = [];
    this.limitValue = undefined;
    this.expect = undefined;
  }

  select(columns = '*') {
    this.action = this.action || 'select';
    this.selectColumns = columns;
    return this;
  }

  insert(payload) {
    this.action = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload) {
    this.action = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column, value) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  in(column, value) {
    this.filters.push({ type: 'in', column, value });
    return this;
  }

  order(column, options = {}) {
    this.orders.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count) {
    this.limitValue = count;
    return this;
  }

  single() {
    this.expect = 'single';
    return this;
  }

  maybeSingle() {
    this.expect = 'maybeSingle';
    return this;
  }

  async execute() {
    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          table: this.table,
          action: this.action,
          payload: this.payload,
          select: this.selectColumns,
          filters: this.filters,
          orders: this.orders,
          limit: this.limitValue,
          expect: this.expect,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        return {
          data: null,
          error: json?.error || { message: `Error HTTP ${response.status}` },
        };
      }

      return json;
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Error de red en API /api/db.' },
      };
    }
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

export const supabase = {
  from(table) {
    return new SupabaseProxyBuilder(table);
  },
};
