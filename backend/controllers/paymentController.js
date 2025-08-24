const RentInvoice = require("../models/RentInvoice");
const Payment = require("../models/Payment");
const Property = require("../models/Property");

/** LANDLORD: create an invoice for a tenant */
exports.createInvoice = async (req, res) => {
  try {
    const {
      tenantId,
      propertyId,
      amount,
      currency = "USD",
      periodStart,
      periodEnd,
      dueDate,
      notes,
    } = req.body;
    if (
      !tenantId ||
      !propertyId ||
      !amount ||
      !periodStart ||
      !periodEnd ||
      !dueDate
    ) {
      return res.status(400).json({
        message:
          "tenantId, propertyId, amount, periodStart, periodEnd, dueDate required",
      });
    }

    // Ensure property belongs to this landlord and tenant is assigned
    const property = await Property.findOne({
      _id: propertyId,
      landlord: req.user.id,
      tenants: tenantId,
    });
    if (!property)
      return res
        .status(403)
        .json({ message: "Property/tenant mismatch or not your property" });

    const inv = await RentInvoice.create({
      tenant: tenantId,
      landlord: req.user.id,
      property: propertyId,
      amount,
      currency,
      periodStart,
      periodEnd,
      dueDate,
      notes,
    });

    res.status(201).json(inv);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

/** TENANT: my invoices */
exports.myInvoices = async (req, res) => {
  try {
    const items = await RentInvoice.find({ tenant: req.user.id })
      .sort({ dueDate: 1 })
      .populate("property", "title address")
      .lean();

    // auto mark overdue (simple)
    const now = new Date();
    items.forEach((i) => {
      if (i.status === "unpaid" && new Date(i.dueDate) < now)
        i.status = "overdue";
    });

    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

/** LANDLORD: all invoices for my properties */
exports.landlordInvoices = async (req, res) => {
  try {
    const items = await RentInvoice.find({ landlord: req.user.id })
      .sort({ dueDate: -1 })
      .populate("tenant", "name email")
      .populate("property", "title address");
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

/** TENANT: mark as paid (manual) — creates a Payment and sets invoice paid */
exports.markPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await RentInvoice.findById(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (String(invoice.tenant) !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });
    if (invoice.status === "paid")
      return res.status(400).json({ message: "Already paid" });

    const pay = await Payment.create({
      invoice: invoice._id,
      tenant: req.user.id,
      amount: invoice.amount,
      method: "manual",
      note: "Marked paid by tenant (manual)",
    });

    invoice.status = "paid";
    await invoice.save();

    res.json({ invoice, payment: pay });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

/** TENANT: request delay */
exports.requestDelay = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, newDueDate } = req.body;
    const invoice = await RentInvoice.findById(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (String(invoice.tenant) !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });

    invoice.delayRequested = true;
    invoice.delayReason = reason || "";
    invoice.newDueDate = newDueDate || null;
    invoice.status = "delayed";
    await invoice.save();

    res.json(invoice);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

/** LANDLORD: approve delay (or update status) */
exports.approveDelay = async (req, res) => {
  try {
    const { id } = req.params;
    const { approve, newDueDate } = req.body;
    const invoice = await RentInvoice.findOne({
      _id: id,
      landlord: req.user.id,
    });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (approve) {
      invoice.dueDate = newDueDate || invoice.newDueDate || invoice.dueDate;
      invoice.delayRequested = false;
      invoice.status = "unpaid";
      await invoice.save();
      return res.json(invoice);
    } else {
      // reject
      invoice.delayRequested = false;
      invoice.status = "unpaid";
      await invoice.save();
      return res.json(invoice);
    }
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};
