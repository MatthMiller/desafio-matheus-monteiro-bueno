import cardapio from './data/cardapio.js';

class CaixaDaLanchonete {
  cardapio = [];
  pedido = [];
  precoFinal;
  metodoDePagamento;

  calcularValorDaCompra(metodoDePagamento, itens) {
    this.formatarCardapio();
    this.pedido = itens;
    this.metodoDePagamento = metodoDePagamento;

    if (!this.checarMetodoDePagamento()) {
      return 'Forma de pagamento inválida!';
    }
    if (!this.pedido.length) {
      return 'Não há itens no carrinho de compra!';
    }
    this.formatarInputPedido();
    if (!this.checarItensPedido()) {
      return 'Item inválido!';
    }
    if (!this.checarQuantidadeItens()) {
      return 'Quantidade inválida!';
    }
    if (!this.checarExtrasSemPrincipal()) {
      return 'Item extra não pode ser pedido sem o principal';
    }

    return this.obterPrecoFinal();
  }

  formatarCardapio() {
    this.cardapio = cardapio.map((itemAtual) => {
      if (itemAtual.hasOwnProperty('extras')) {
        itemAtual.extras.forEach((extraAtual) => {
          extraAtual.codigoParent = itemAtual.codigo;
        });
      }
      return itemAtual;
    });
  }

  formatarInputPedido() {
    this.pedido = this.pedido.map((i) => {
      return { codigo: i.split(',')[0], quantidade: i.split(',')[1] };
    });
  }

  checarItensPedido() {
    // Verifica se o código ou quantidade não foi definida
    if (
      this.pedido.filter(
        ({ codigo, quantidade }) =>
          quantidade === undefined || codigo === undefined
      ).length
    ) {
      return false;
    }

    // Validando se existem códigos que não constam
    // no cardápio
    let codigosCardapio = [];
    this.cardapio.forEach((itemAtual) => {
      codigosCardapio.push(itemAtual.codigo);
      if (itemAtual.extras) {
        itemAtual.extras.forEach(({ codigo }) => {
          codigosCardapio.push(codigo);
        });
      }
    });
    const codigosPedido = this.pedido.map(({ codigo }) => codigo);
    if (
      codigosPedido
        .filter((codigoPedido) => codigosCardapio.includes(codigoPedido))
        .toString() !== codigosPedido.toString()
    ) {
      return false;
    }
    return true;
  }

  checarQuantidadeItens() {
    for (const pedido of this.pedido) {
      if (pedido.quantidade == 0) return false;
    }
    return true;
  }

  checarExtrasSemPrincipal() {
    const itensComExtra = this.cardapio.filter(({ extras }) => {
      return extras?.length;
    });
    let itensExtra = [];
    itensComExtra.forEach(({ extras }) => {
      extras.forEach(({ codigo, codigoParent, valor }) => {
        itensExtra.push({ codigo, codigoParent, valor });
      });
    });
    this.itensExtra = itensExtra;

    const extrasNoPedido = this.pedido
      .map((itemPedido) => {
        for (const itemExtra of itensExtra) {
          if (itemExtra.codigo === itemPedido.codigo) {
            return itemPedido.codigo;
          }
        }
      })
      .filter((item) => item !== undefined);

    let possuiExtrasSemPrincipal;
    if (extrasNoPedido.length) {
      extrasNoPedido.forEach((extraNoPedido) => {
        itensExtra.forEach((extraNoCardapio) => {
          if (extraNoCardapio.codigo === extraNoPedido) {
            const itensComCodigoParent = this.pedido.filter(
              (itemPedido) => extraNoCardapio.codigoParent === itemPedido.codigo
            );

            if (
              !itensComCodigoParent.length &&
              possuiExtrasSemPrincipal === undefined
            ) {
              possuiExtrasSemPrincipal = true;
            }
          }
        });
      });
    }
    if (possuiExtrasSemPrincipal) {
      return false;
    }
    return true;
  }

  checarMetodoDePagamento() {
    const metodosValidos = ['debito', 'credito', 'dinheiro'];
    return metodosValidos.includes(this.metodoDePagamento);
  }

  obterPrecoFinal() {
    let pedidoComPreco = [];
    this.pedido.forEach(
      ({ codigo: codigoPedido, quantidade: quantidadePedido }) => {
        this.cardapio.forEach(
          ({ codigo: codigoCardapio, valor: valorCardapio }) => {
            if (codigoPedido === codigoCardapio) {
              pedidoComPreco.push({
                codigo: codigoPedido,
                quantidade: +quantidadePedido,
                valor: valorCardapio,
                valorTotal: valorCardapio * +quantidadePedido,
              });
            }
          }
        );
        this.itensExtra.forEach(
          ({ codigo: codigoExtra, valor: valorExtra }) => {
            if (codigoPedido === codigoExtra) {
              pedidoComPreco.push({
                codigo: codigoPedido,
                quantidade: +quantidadePedido,
                valor: valorExtra,
                valorTotal: valorExtra * +quantidadePedido,
              });
            }
          }
        );
      }
    );
    const valoresSomados = pedidoComPreco
      .map(({ valorTotal }) => valorTotal)
      .reduce((a, b) => a + b, 0);
    const valorComTaxas = this.aplicarDescontosETaxas(valoresSomados);
    const valorFormatado = this.formatarPreco(valorComTaxas);

    return valorFormatado;
  }

  aplicarDescontosETaxas(preco) {
    if (typeof preco === 'number') {
      if (this.metodoDePagamento === 'dinheiro') {
        return preco - preco * 0.05;
      }

      if (this.metodoDePagamento === 'credito') {
        return preco + preco * 0.03;
      }
    }
    return preco;
  }

  formatarPreco(preco) {
    return `R$ ${preco.toFixed(2).replace('.', ',')}`;
  }
}

export { CaixaDaLanchonete };
